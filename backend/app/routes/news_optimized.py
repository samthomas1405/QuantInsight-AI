from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.auth import get_current_user
from app.dependencies import get_db
from app.models.user import User
from app.routes.user_stocks import get_followed_stock_symbols
import os
import logging
import traceback
from crewai import Agent, Task, Crew
from app.tools.serper_tool import SerperSearchTool
from app.utils.yahoo_finance_news import fetch_yahoo_finance_news, fetch_market_news
from dotenv import load_dotenv
import asyncio
from concurrent.futures import ThreadPoolExecutor, TimeoutError, as_completed
import time
from datetime import datetime, timedelta
import json
from typing import Dict, List, Any, Optional
import redis
import hashlib
from enum import Enum

try:
    from dateutil import parser as date_parser
except ImportError:
    date_parser = None

# Import the improved Gemini wrapper instead of Groq
from app.crew_groq_wrapper import CrewCompatibleGemini, test_crew_gemini_with_detailed_logging

load_dotenv()
router = APIRouter()

# Enhanced logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Redis client
redis_client = None
try:
    redis_client = redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', 6379)),
        db=int(os.getenv('REDIS_DB', 0)),
        decode_responses=True
    )
    redis_client.ping()
    logger.info("Redis connection established for prediction caching")
except Exception as e:
    logger.warning(f"Redis not available, caching disabled: {e}")
    redis_client = None

class AnalysisType(str, Enum):
    QUICK = "quick"  # Technical analysis only (~30s per ticker)
    STANDARD = "standard"  # Technical + Sentiment (~60s per ticker)
    COMPREHENSIVE = "comprehensive"  # All agents (~120s per ticker)

def get_cache_key(ticker: str, analysis_type: AnalysisType, user_id: int) -> str:
    """Generate cache key for analysis results"""
    return f"analysis:{analysis_type}:{ticker}:{user_id}"

def get_cached_analysis(ticker: str, analysis_type: AnalysisType, user_id: int) -> Optional[Dict]:
    """Retrieve cached analysis if available and not expired"""
    if not redis_client:
        return None
    
    try:
        key = get_cache_key(ticker, analysis_type, user_id)
        cached = redis_client.get(key)
        if cached:
            logger.info(f"Cache hit for {ticker} ({analysis_type})")
            return json.loads(cached)
    except Exception as e:
        logger.error(f"Redis get error: {e}")
    
    return None

def cache_analysis(ticker: str, analysis_type: AnalysisType, user_id: int, data: Dict, ttl_hours: int = 2):
    """Cache analysis results with TTL"""
    if not redis_client:
        return
    
    try:
        key = get_cache_key(ticker, analysis_type, user_id)
        redis_client.setex(
            key,
            timedelta(hours=ttl_hours),
            json.dumps(data)
        )
        logger.info(f"Cached analysis for {ticker} ({analysis_type}) with {ttl_hours}h TTL")
    except Exception as e:
        logger.error(f"Redis set error: {e}")

def validate_environment():
    """Validate required environment variables for Gemini"""
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        raise HTTPException(status_code=500, detail="Missing GOOGLE_API_KEY environment variable")
    
    serper_api_key = os.getenv("SERPER_API_KEY")
    if not serper_api_key:
        logger.warning("SERPER_API_KEY not found, search functionality may be limited")
    
    return google_api_key, serper_api_key

def create_selective_agents(llm, tools, analysis_type: AnalysisType):
    """Create only the agents needed for the selected analysis type"""
    agents = {}
    
    # Market Data Analyst - Always included
    market_analyst = Agent(
        role="Market Data Analyst",
        goal="Analyze technical indicators, price movements, and market trends",
        backstory="""You are an expert technical analyst with 15+ years of experience in stock market analysis. 
        You specialize in identifying chart patterns, support/resistance levels, volume analysis, and technical indicators 
        like RSI, MACD, and moving averages. You provide data-driven insights based on price action.""",
        llm=llm,
        tools=tools,
        verbose=False,
        max_execution_time=120,  # Reduced from 180
        allow_delegation=False,
        memory=False,
        max_iter=2,  # Reduced from 3
        max_retry_limit=1  # Reduced from 2
    )
    agents["market_analyst"] = market_analyst
    
    # Add more agents based on analysis type
    if analysis_type in [AnalysisType.STANDARD, AnalysisType.COMPREHENSIVE]:
        # News & Sentiment Analyst
        sentiment_analyst = Agent(
            role="News & Sentiment Analyst",
            goal="Analyze market sentiment, news impact, and social media trends",
            backstory="""You are a market sentiment expert who tracks news flow, analyst ratings, 
            social media sentiment, and institutional investor behavior. You identify how external factors 
            and market psychology affect stock prices and predict sentiment-driven price movements.""",
            llm=llm,
            tools=tools,
            verbose=False,
            max_execution_time=120,
            allow_delegation=False,
            memory=False,
            max_iter=2,
            max_retry_limit=1
        )
        agents["sentiment_analyst"] = sentiment_analyst
    
    if analysis_type == AnalysisType.COMPREHENSIVE:
        # Fundamental Analyst
        fundamental_analyst = Agent(
            role="Fundamental Analyst",
            goal="Evaluate company financials, business model, and intrinsic value",
            backstory="""You are a seasoned fundamental analyst with expertise in financial statement analysis, 
            valuation models, and business evaluation. You examine earnings, revenue growth, debt levels, 
            competitive positioning, and management effectiveness. You determine fair value and long-term prospects.""",
            llm=llm,
            tools=tools,
            verbose=False,
            max_execution_time=120,
            allow_delegation=False,
            memory=False,
            max_iter=2,
            max_retry_limit=1
        )
        agents["fundamental_analyst"] = fundamental_analyst
        
        # Risk Analyst
        risk_analyst = Agent(
            role="Risk Analyst",
            goal="Identify and assess investment risks and portfolio impact",
            backstory="""You are a risk management specialist who identifies market risks, company-specific risks, 
            sector risks, and geopolitical factors. You evaluate downside scenarios, volatility, and provide 
            risk mitigation strategies. You help investors understand potential losses and risk-reward ratios.""",
            llm=llm,
            tools=tools,
            verbose=False,
            max_execution_time=120,
            allow_delegation=False,
            memory=False,
            max_iter=2,
            max_retry_limit=1
        )
        agents["risk_analyst"] = risk_analyst
        
        # Strategy Advisor
        strategy_advisor = Agent(
            role="Investment Strategy Advisor", 
            goal="Synthesize all analyses into actionable investment recommendations",
            backstory="""You are a senior investment strategist who combines technical, fundamental, sentiment, 
            and risk analyses to provide clear investment recommendations. You consider different investor profiles, 
            time horizons, and risk tolerances. You provide specific entry/exit points and portfolio allocation advice.""",
            llm=llm,
            tools=tools,
            verbose=False,
            max_execution_time=120,
            allow_delegation=False,
            memory=False,
            max_iter=2,
            max_retry_limit=1
        )
        agents["strategy_advisor"] = strategy_advisor
    
    logger.info(f"Created {len(agents)} agents for {analysis_type} analysis")
    return agents

def create_selective_tasks(ticker: str, agents: Dict[str, Agent], analysis_type: AnalysisType):
    """Create only the tasks needed for the selected analysis type"""
    tasks = []
    
    # Market Analysis Task - Always included
    market_task = Task(
        description=f"""Analyze {ticker} technical indicators and price action:
        1. Current price trends and momentum (bullish/bearish/neutral)
        2. Key support and resistance levels with specific prices
        3. Volume analysis and what it indicates
        4. Technical indicators (RSI, MACD, Moving Averages) interpretation
        5. Chart patterns if any (head and shoulders, triangles, etc.)
        
        Provide specific price levels and actionable insights. Be concise but precise.""",
        agent=agents["market_analyst"],
        expected_output="Technical analysis with specific price levels, trends, and trading signals"
    )
    tasks.append(market_task)
    
    if analysis_type in [AnalysisType.STANDARD, AnalysisType.COMPREHENSIVE]:
        # Sentiment Analysis Task
        sentiment_task = Task(
            description=f"""Analyze {ticker} market sentiment and news impact:
            1. Recent news headlines and their impact (positive/negative/neutral)
            2. Analyst ratings and price targets consensus
            3. Social media sentiment and retail investor interest
            4. Institutional investor activity and insider trading if available
            5. Overall market sentiment towards the stock
            
            Focus on the last 7-14 days of sentiment. Be specific about sentiment shifts.""",
            agent=agents["sentiment_analyst"],
            expected_output="Sentiment analysis with specific news impacts and market perception"
        )
        tasks.append(sentiment_task)
    
    if analysis_type == AnalysisType.COMPREHENSIVE:
        # Fundamental Analysis Task
        fundamental_task = Task(
            description=f"""Analyze {ticker} fundamental metrics and business health:
            1. Revenue and earnings growth trends (YoY and QoQ)
            2. Profit margins and operational efficiency
            3. Debt levels and financial health (debt-to-equity, cash flow)
            4. Competitive positioning and market share
            5. Valuation metrics (P/E, P/B, PEG) vs industry averages
            
            Compare to industry peers when possible. Focus on what matters for investors.""",
            agent=agents["fundamental_analyst"],
            expected_output="Fundamental analysis with key metrics, growth prospects, and valuation assessment"
        )
        tasks.append(fundamental_task)
        
        # Risk Assessment Task
        risk_task = Task(
            description=f"""Identify and assess risks for {ticker} investment:
            1. Market risks (volatility, sector rotation, macro factors)
            2. Company-specific risks (competition, regulation, execution)
            3. Financial risks (debt, cash flow, currency exposure)
            4. External risks (geopolitical, supply chain, technology disruption)
            5. Risk mitigation strategies and hedging options
            
            Quantify risks where possible. Provide actionable risk management advice.""",
            agent=agents["risk_analyst"],
            expected_output="Comprehensive risk assessment with specific risk factors and mitigation strategies"
        )
        tasks.append(risk_task)
        
        # Investment Strategy Task
        strategy_task = Task(
            description=f"""Synthesize all analyses into investment strategy for {ticker}:
            1. Overall investment recommendation (buy/hold/sell) with conviction level
            2. Entry and exit price targets with rationale
            3. Time horizon for the investment (short/medium/long term)
            4. Position sizing recommendations based on risk
            5. Alternative strategies (options, dollar-cost averaging, etc.)
            
            Tailor recommendations for different investor profiles. Be specific and actionable.""",
            agent=agents["strategy_advisor"],
            expected_output="Clear investment strategy with specific recommendations and price targets"
        )
        tasks.append(strategy_task)
    
    logger.info(f"Created {len(tasks)} tasks for {ticker} ({analysis_type} analysis)")
    return tasks

def execute_selective_stock_prediction(
    ticker: str, 
    llm, 
    tools, 
    analysis_type: AnalysisType,
    timeout_seconds: int = 300
) -> Dict[str, Any]:
    """Execute stock prediction with only the required agents based on analysis type"""
    
    def run_prediction_analysis():
        try:
            logger.info(f"Starting {analysis_type} analysis for {ticker}")
            
            # Create selective agents
            agents = create_selective_agents(llm, tools, analysis_type)
            
            # Create selective tasks
            tasks = create_selective_tasks(ticker, agents, analysis_type)
            
            # Create and run crew
            crew = Crew(
                agents=list(agents.values()),
                tasks=tasks,
                verbose=False,
                process="sequential",
                max_iterations=2
            )
            
            result = crew.kickoff()
            
            # Process results based on analysis type
            prediction_results = {}
            
            try:
                if hasattr(result, 'tasks_output') and result.tasks_output:
                    task_outputs = result.tasks_output
                    
                    # Always include market analysis
                    prediction_results["market_analysis"] = str(task_outputs[0]) if len(task_outputs) > 0 else "Analysis not available"
                    
                    if analysis_type in [AnalysisType.STANDARD, AnalysisType.COMPREHENSIVE]:
                        prediction_results["sentiment_analysis"] = str(task_outputs[1]) if len(task_outputs) > 1 else "Analysis not available"
                    
                    if analysis_type == AnalysisType.COMPREHENSIVE:
                        prediction_results["fundamental_analysis"] = str(task_outputs[2]) if len(task_outputs) > 2 else "Analysis not available"
                        prediction_results["risk_assessment"] = str(task_outputs[3]) if len(task_outputs) > 3 else "Analysis not available"
                        prediction_results["investment_strategy"] = str(task_outputs[4]) if len(task_outputs) > 4 else "Strategy not available"
                else:
                    # Fallback
                    content = str(result)
                    prediction_results = {
                        "comprehensive_analysis": content,
                        "note": "Results presented in combined format"
                    }
                    
            except Exception as e:
                logger.error(f"Error processing results: {e}")
                prediction_results = {"error": str(e)}
            
            # Add metadata
            prediction_results.update({
                "ticker": ticker,
                "timestamp": datetime.now().isoformat(),
                "analysis_type": analysis_type,
                "agents_used": list(agents.keys()),
                "model": "gemini-2.0-flash"
            })
            
            logger.info(f"✓ Completed {analysis_type} analysis for {ticker}")
            
            return {
                "status": "success",
                "prediction": prediction_results,
                "ticker": ticker
            }
            
        except Exception as e:
            logger.error(f"✗ {analysis_type} analysis failed for {ticker}: {e}")
            logger.error(f"Error traceback: {traceback.format_exc()}")
            
            # Provide fallback
            fallback_prediction = {
                "ticker": ticker,
                "timestamp": datetime.now().isoformat(),
                "analysis_type": analysis_type,
                "model": "gemini-2.0-flash",
                "market_analysis": f"{ticker} technical analysis unavailable due to processing error.",
                "note": "Analysis encountered technical difficulties. Please try again."
            }
            
            return {
                "status": "fallback",
                "prediction": fallback_prediction,
                "error": str(e),
                "ticker": ticker
            }
    
    # Execute with timeout protection
    try:
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(run_prediction_analysis)
            try:
                result = future.result(timeout=timeout_seconds)
                return result
            except TimeoutError:
                logger.error(f"{analysis_type} analysis timed out for {ticker}")
                return {
                    "status": "timeout",
                    "prediction": {
                        "ticker": ticker,
                        "error": f"{analysis_type} analysis timed out",
                        "timestamp": datetime.now().isoformat()
                    },
                    "ticker": ticker
                }
    except Exception as e:
        logger.error(f"Execution error for {ticker}: {e}")
        return {
            "status": "error",
            "prediction": {
                "ticker": ticker,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            },
            "ticker": ticker
        }

def execute_parallel_selective_analysis(
    tickers: List[str], 
    llm, 
    tools, 
    analysis_type: AnalysisType,
    max_workers: int = 3,
    user_id: int = None
) -> Dict[str, Any]:
    """Execute selective analysis for multiple tickers in parallel with caching"""
    logger.info(f"Starting parallel {analysis_type} analysis for {len(tickers)} tickers")
    
    results = {}
    start_time = time.time()
    
    # Set timeouts based on analysis type
    timeout_map = {
        AnalysisType.QUICK: 60,
        AnalysisType.STANDARD: 120,
        AnalysisType.COMPREHENSIVE: 300
    }
    timeout = timeout_map.get(analysis_type, 300)
    
    # Check cache first
    tickers_to_analyze = []
    for ticker in tickers:
        cached = get_cached_analysis(ticker, analysis_type, user_id) if user_id else None
        if cached:
            results[ticker] = cached
            logger.info(f"Using cached result for {ticker}")
        else:
            tickers_to_analyze.append(ticker)
    
    # Analyze remaining tickers in parallel
    if tickers_to_analyze:
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_ticker = {
                executor.submit(execute_selective_stock_prediction, ticker, llm, tools, analysis_type, timeout): ticker 
                for ticker in tickers_to_analyze
            }
            
            for future in as_completed(future_to_ticker, timeout=timeout * 2):
                ticker = future_to_ticker[future]
                try:
                    result = future.result()
                    results[ticker] = result
                    
                    # Cache successful results
                    if result.get("status") == "success" and user_id:
                        cache_analysis(ticker, analysis_type, user_id, result)
                    
                    logger.info(f"✓ Completed {analysis_type} analysis for {ticker}")
                except Exception as e:
                    logger.error(f"✗ Failed {analysis_type} analysis for {ticker}: {e}")
                    results[ticker] = {
                        "status": "error",
                        "prediction": {
                            "ticker": ticker,
                            "error": str(e),
                            "timestamp": datetime.now().isoformat(),
                            "analysis_type": analysis_type
                        },
                        "ticker": ticker
                    }
    
    end_time = time.time()
    total_time = end_time - start_time
    
    logger.info(f"Parallel {analysis_type} analysis completed in {total_time:.2f} seconds")
    
    return results

@router.get("/custom-summary")
async def generate_reports(
    tickers: Optional[str] = Query(None, description="Comma-separated list of tickers"),
    analysis_type: AnalysisType = Query(AnalysisType.STANDARD, description="Type of analysis: quick, standard, or comprehensive"),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI-powered stock prediction reports with optimized performance
    
    Analysis Types:
    - quick: Technical analysis only (~30s per ticker)
    - standard: Technical + Sentiment analysis (~60s per ticker)  
    - comprehensive: Full multi-agent analysis (~120s per ticker)
    """
    try:
        logger.info(f"=== Starting {analysis_type} analysis for user {current_user.id} ===")
        
        # Validate environment
        google_api_key, serper_api_key = validate_environment()
        
        # Get tickers
        ticker_list = []
        if tickers:
            ticker_list = [t.strip().upper() for t in tickers.split(',') if t.strip()]
            logger.info(f"Using selected tickers: {ticker_list}")
        else:
            ticker_list = get_followed_stock_symbols(current_user.id, db)
            if not ticker_list:
                ticker_list = ["AAPL", "MSFT"]
                logger.info("No followed stocks found, using defaults")
            else:
                # Adjust limit based on analysis type
                limits = {
                    AnalysisType.QUICK: 10,
                    AnalysisType.STANDARD: 5,
                    AnalysisType.COMPREHENSIVE: 3
                }
                limit = limits.get(analysis_type, 3)
                ticker_list = ticker_list[:limit]
        
        logger.info(f"Processing {len(ticker_list)} tickers for {analysis_type} analysis")
        
        # Initialize Gemini LLM
        llm = CrewCompatibleGemini(
            model="gemini-2.0-flash", 
            temperature=0.1,
            google_api_key=google_api_key,
            max_tokens=600
        )
        
        # Initialize tools
        tools = []
        if serper_api_key:
            tools.append(SerperSearchTool())
        
        # Execute parallel analysis with caching
        start_time = time.time()
        
        prediction_reports = execute_parallel_selective_analysis(
            ticker_list, 
            llm, 
            tools, 
            analysis_type,
            max_workers=min(5, len(ticker_list)),
            user_id=current_user.id
        )
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Count successful predictions
        successful_predictions = sum(
            1 for result in prediction_reports.values() 
            if result.get("status") in ["success", "fallback"]
        )
        
        # Response
        response = {
            "reports": prediction_reports,
            "summary": {
                "total_tickers": len(ticker_list),
                "successful_predictions": successful_predictions,
                "success_rate": f"{(successful_predictions/len(ticker_list)*100):.1f}%" if ticker_list else "0%",
                "analysis_type": analysis_type,
                "model": "gemini-2.0-flash",
                "execution_time_seconds": round(total_time, 2),
                "average_time_per_ticker": round(total_time / len(ticker_list), 2) if ticker_list else 0,
                "cache_enabled": redis_client is not None,
                "timestamp": datetime.now().isoformat()
            },
            "status": "completed",
            "message": f"{analysis_type.capitalize()} analysis completed in {total_time:.1f}s"
        }
        
        logger.info(f"=== {analysis_type} analysis completed in {total_time:.2f}s ===")
        return response
        
    except Exception as e:
        logger.error(f"Critical error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return {
            "reports": {},
            "summary": {
                "total_tickers": 0,
                "successful_predictions": 0,
                "success_rate": "0%",
                "analysis_type": analysis_type,
                "model": "gemini-2.0-flash",
                "execution_time_seconds": 0,
                "timestamp": datetime.now().isoformat()
            },
            "status": "error",
            "message": f"Analysis failed: {str(e)}"
        }

@router.get("/analysis-stream/{ticker}")
async def stream_analysis(
    ticker: str,
    analysis_type: AnalysisType = Query(AnalysisType.STANDARD),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Stream analysis results as they complete (SSE endpoint for frontend progressive loading)
    """
    async def generate():
        try:
            # Check cache first
            cached = get_cached_analysis(ticker.upper(), analysis_type, current_user.id)
            if cached:
                yield f"data: {json.dumps({'type': 'cached', 'data': cached})}\n\n"
                return
            
            # Initialize
            google_api_key, serper_api_key = validate_environment()
            
            llm = CrewCompatibleGemini(
                model="gemini-2.0-flash",
                temperature=0.1,
                google_api_key=google_api_key,
                max_tokens=600
            )
            
            tools = []
            if serper_api_key:
                tools.append(SerperSearchTool())
            
            # Create agents and tasks
            agents = create_selective_agents(llm, tools, analysis_type)
            tasks = create_selective_tasks(ticker.upper(), agents, analysis_type)
            
            # Stream progress
            yield f"data: {json.dumps({'type': 'start', 'ticker': ticker, 'analysis_type': analysis_type})}\n\n"
            
            # Execute tasks and stream results
            results = {}
            for i, (task, agent_name) in enumerate(zip(tasks, agents.keys())):
                yield f"data: {json.dumps({'type': 'progress', 'agent': agent_name, 'status': 'running'})}\n\n"
                
                try:
                    # Execute single task
                    crew = Crew(
                        agents=[agents[agent_name]],
                        tasks=[task],
                        verbose=False,
                        process="sequential"
                    )
                    
                    result = crew.kickoff()
                    task_result = str(result.tasks_output[0]) if hasattr(result, 'tasks_output') else str(result)
                    
                    results[agent_name] = task_result
                    
                    yield f"data: {json.dumps({'type': 'result', 'agent': agent_name, 'result': task_result})}\n\n"
                    
                except Exception as e:
                    logger.error(f"Task error for {agent_name}: {e}")
                    yield f"data: {json.dumps({'type': 'error', 'agent': agent_name, 'error': str(e)})}\n\n"
            
            # Final result
            final_result = {
                "status": "success",
                "prediction": {
                    **results,
                    "ticker": ticker.upper(),
                    "timestamp": datetime.now().isoformat(),
                    "analysis_type": analysis_type,
                    "model": "gemini-2.0-flash"
                },
                "ticker": ticker.upper()
            }
            
            # Cache the result
            cache_analysis(ticker.upper(), analysis_type, current_user.id, final_result)
            
            yield f"data: {json.dumps({'type': 'complete', 'data': final_result})}\n\n"
            
        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.delete("/cache/clear")
async def clear_cache(
    ticker: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Clear cached analysis results"""
    if not redis_client:
        return {"status": "error", "message": "Cache not available"}
    
    try:
        if ticker:
            # Clear specific ticker cache
            for analysis_type in AnalysisType:
                key = get_cache_key(ticker.upper(), analysis_type, current_user.id)
                redis_client.delete(key)
            return {"status": "success", "message": f"Cleared cache for {ticker}"}
        else:
            # Clear all user's cache
            pattern = f"analysis:*:*:{current_user.id}"
            keys = redis_client.keys(pattern)
            if keys:
                redis_client.delete(*keys)
            return {"status": "success", "message": f"Cleared {len(keys)} cached entries"}
    except Exception as e:
        logger.error(f"Cache clear error: {e}")
        return {"status": "error", "message": str(e)}