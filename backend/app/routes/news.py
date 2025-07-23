from fastapi import APIRouter, Depends, HTTPException
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
from dotenv import load_dotenv
import asyncio
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import time
from datetime import datetime, timedelta
import json
from typing import Dict, List, Any, Optional

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

def validate_environment():
    """Validate required environment variables for Gemini"""
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        raise HTTPException(status_code=500, detail="Missing GOOGLE_API_KEY environment variable")
    
    serper_api_key = os.getenv("SERPER_API_KEY")
    if not serper_api_key:
        logger.warning("SERPER_API_KEY not found, search functionality may be limited")
    
    return google_api_key, serper_api_key

def create_stock_prediction_agents(llm, tools):
    """Create specialized CrewAI agents for comprehensive stock prediction using Gemini"""
    try:
        logger.info("Creating specialized stock prediction agents with Gemini...")
        
        # Market Data Analyst - Focuses on technical analysis and price data
        market_analyst = Agent(
            role="Market Data Analyst",
            goal="Analyze technical indicators, price movements, and market trends",
            backstory="""You are an expert technical analyst with 15+ years of experience in stock market analysis. 
            You specialize in identifying chart patterns, support/resistance levels, volume analysis, and technical indicators 
            like RSI, MACD, and moving averages. You provide data-driven insights based on price action.""",
            llm=llm,
            tools=tools,
            verbose=False,
            max_execution_time=180,  # Increased timeout for Gemini
            allow_delegation=False,
            memory=False,
            max_iter=3,
            max_retry_limit=2
        )
        
        # Fundamental Analyst - Focuses on company fundamentals and financials
        fundamental_analyst = Agent(
            role="Fundamental Analyst",
            goal="Evaluate company financials, business model, and intrinsic value",
            backstory="""You are a seasoned fundamental analyst with expertise in financial statement analysis, 
            valuation models, and business evaluation. You examine earnings, revenue growth, debt levels, 
            competitive positioning, and management effectiveness. You determine fair value and long-term prospects.""",
            llm=llm,
            tools=tools,
            verbose=False,
            max_execution_time=180,  # Increased timeout for Gemini
            allow_delegation=False,
            memory=False,
            max_iter=3,
            max_retry_limit=2
        )
        
        # News & Sentiment Analyst - Focuses on market sentiment and news impact
        sentiment_analyst = Agent(
            role="News & Sentiment Analyst",
            goal="Analyze market sentiment, news impact, and social media trends",
            backstory="""You are a market sentiment expert who tracks news flow, analyst ratings, 
            social media sentiment, and institutional investor behavior. You identify how external factors 
            and market psychology affect stock prices and predict sentiment-driven price movements.""",
            llm=llm,
            tools=tools,
            verbose=False,
            max_execution_time=180,  # Increased timeout for Gemini
            allow_delegation=False,
            memory=False,
            max_iter=3,
            max_retry_limit=2
        )
        
        # Risk Assessment Analyst - Focuses on risk factors and portfolio considerations
        risk_analyst = Agent(
            role="Risk Assessment Analyst",
            goal="Evaluate investment risks and provide risk-adjusted recommendations",
            backstory="""You are a risk management specialist who identifies potential downside risks, 
            volatility patterns, correlation with market indices, and black swan events. You assess 
            portfolio fit, position sizing recommendations, and hedge strategies.""",
            llm=llm,
            tools=tools,
            verbose=False,
            max_execution_time=180,  # Increased timeout for Gemini
            allow_delegation=False,
            memory=False,
            max_iter=3,
            max_retry_limit=2
        )
        
        # Strategy Synthesizer - Combines all analyses into actionable recommendations
        strategy_synthesizer = Agent(
            role="Investment Strategy Synthesizer",
            goal="Synthesize all analyses into clear, actionable investment recommendations",
            backstory="""You are a senior portfolio manager who combines technical, fundamental, 
            sentiment, and risk analyses to create comprehensive investment strategies. You provide 
            clear buy/hold/sell recommendations with specific price targets, timeframes, and rationale.""",
            llm=llm,
            tools=[],  # No search tools - focuses on synthesis
            verbose=False,
            max_execution_time=180,  # Increased timeout for Gemini
            allow_delegation=False,
            memory=False,
            max_iter=2,
            max_retry_limit=1
        )
        
        agents = {
            "market_analyst": market_analyst,
            "fundamental_analyst": fundamental_analyst,
            "sentiment_analyst": sentiment_analyst,
            "risk_analyst": risk_analyst,
            "strategy_synthesizer": strategy_synthesizer
        }
        
        logger.info(f"Successfully created {len(agents)} specialized agents with Gemini")
        return agents
        
    except Exception as e:
        logger.error(f"Failed to create prediction agents with Gemini: {e}")
        raise

def create_prediction_tasks(ticker: str, agents: Dict) -> List[Task]:
    """Create comprehensive prediction tasks for each agent"""
    try:
        logger.info(f"Creating prediction tasks for {ticker}")
        
        # Task 1: Market Data Analysis
        market_analysis_task = Task(
            description=f"""
            Analyze the technical aspects of {ticker}:
            1. Recent price action and trends (1 month, 3 months, 6 months)
            2. Key support and resistance levels
            3. Volume analysis and any unusual patterns
            4. Technical indicators (RSI, MACD, moving averages if available)
            5. Chart patterns or breakout signals
            
            Provide a technical outlook with specific price levels and timeframes.
            Keep analysis under 200 words but be specific with numbers when possible.
            """,
            expected_output=f"Technical analysis of {ticker} with price levels, trends, and indicators",
            agent=agents["market_analyst"]
        )
        
        # Task 2: Fundamental Analysis
        fundamental_analysis_task = Task(
            description=f"""
            Evaluate the fundamental strength of {ticker}:
            1. Business model and competitive position
            2. Recent earnings and revenue trends
            3. Key financial ratios and debt levels
            4. Management effectiveness and strategic direction
            5. Growth prospects and market opportunity
            
            Assess intrinsic value vs current price and long-term outlook.
            Keep analysis under 200 words but include specific financial metrics when available.
            """,
            expected_output=f"Fundamental analysis of {ticker} with financial metrics and valuation assessment",
            agent=agents["fundamental_analyst"]
        )
        
        # Task 3: Sentiment Analysis
        sentiment_analysis_task = Task(
            description=f"""
            Analyze sentiment and news impact for {ticker}:
            1. Recent news and announcements affecting the stock
            2. Analyst ratings and price target changes
            3. Market sentiment and investor behavior
            4. Social media sentiment and retail investor interest
            5. Institutional activity and insider trading
            
            Determine how sentiment factors may drive near-term price action.
            Keep analysis under 200 words but highlight key sentiment drivers.
            """,
            expected_output=f"Sentiment analysis of {ticker} with news impact and market psychology insights",
            agent=agents["sentiment_analyst"]
        )
        
        # Task 4: Risk Assessment
        risk_assessment_task = Task(
            description=f"""
            Assess investment risks for {ticker}:
            1. Company-specific risks (competition, regulation, technology)
            2. Market risks (correlation with indices, sector rotation)
            3. Volatility analysis and downside protection
            4. Macroeconomic sensitivities
            5. Liquidity and position sizing considerations
            
            Rate overall risk level and suggest portfolio allocation guidelines.
            Keep analysis under 200 words but be specific about risk levels.
            """,
            expected_output=f"Risk assessment of {ticker} with specific risk factors and portfolio guidance",
            agent=agents["risk_analyst"]
        )
        
        # Task 5: Strategy Synthesis (depends on all previous tasks)
        strategy_synthesis_task = Task(
            description=f"""
            Based on the technical, fundamental, sentiment, and risk analyses provided, 
            create a comprehensive investment recommendation for {ticker}:
            
            1. Clear BUY/HOLD/SELL recommendation
            2. Price targets (1-month, 3-month, 6-month)
            3. Key catalysts to watch
            4. Risk/reward ratio assessment
            5. Position sizing and entry/exit strategy
            6. Timeline for reassessment
            
            Synthesize all previous analyses into actionable guidance.
            Keep final recommendation under 250 words but be specific with targets and rationale.
            """,
            expected_output=f"Comprehensive investment strategy for {ticker} with specific recommendations and price targets",
            agent=agents["strategy_synthesizer"],
            context=[market_analysis_task, fundamental_analysis_task, sentiment_analysis_task, risk_assessment_task]
        )
        
        tasks = [
            market_analysis_task,
            fundamental_analysis_task, 
            sentiment_analysis_task,
            risk_assessment_task,
            strategy_synthesis_task
        ]
        
        logger.info(f"Successfully created {len(tasks)} prediction tasks")
        return tasks
        
    except Exception as e:
        logger.error(f"Failed to create prediction tasks: {e}")
        raise

def execute_stock_prediction(ticker: str, llm, tools, timeout_seconds: int = 400) -> Dict[str, Any]:
    """Execute comprehensive multi-agent stock prediction using Gemini"""
    def run_prediction_analysis():
        try:
            logger.info(f"=== Starting Gemini multi-agent prediction for {ticker} ===")
            
            # Create specialized agents
            agents = create_stock_prediction_agents(llm, tools)
            
            # Create prediction tasks
            tasks = create_prediction_tasks(ticker, agents)
            
            # Configure crew for comprehensive analysis with Gemini-optimized settings
            crew = Crew(
                agents=list(agents.values()),
                tasks=tasks,
                verbose=True,
                max_execution_time=timeout_seconds,
                memory=False,
                cache=False,
                process="sequential"  # Sequential ensures proper task dependencies
            )
            
            logger.info(f"Executing Gemini multi-agent prediction crew for {ticker}")
            
            # Execute prediction analysis
            try:
                result = crew.kickoff()
            except Exception as e:
                logger.error(f"🔥 Gemini crew execution failed for {ticker}: {e}")
                logger.error("⚠️ Full traceback:")
                logger.error(traceback.format_exc())
                raise

            # Log the raw result
            logger.info(f"📦 Raw Gemini crew result for {ticker}: {result}")

            # If it contains individual task outputs, log them too
            if hasattr(result, 'tasks_output') and result.tasks_output:
                for i, output in enumerate(result.tasks_output, 1):
                    logger.info(f"📤 Gemini task {i} output for {ticker}: {output}")
            
            # Process and structure results
            prediction_results = {}
            
            try:
                # Extract results from each task
                if hasattr(result, 'tasks_output') and result.tasks_output:
                    task_outputs = result.tasks_output
                    
                    prediction_results = {
                        "market_analysis": str(task_outputs[0]) if len(task_outputs) > 0 else "Analysis not available",
                        "fundamental_analysis": str(task_outputs[1]) if len(task_outputs) > 1 else "Analysis not available", 
                        "sentiment_analysis": str(task_outputs[2]) if len(task_outputs) > 2 else "Analysis not available",
                        "risk_assessment": str(task_outputs[3]) if len(task_outputs) > 3 else "Analysis not available",
                        "investment_strategy": str(task_outputs[4]) if len(task_outputs) > 4 else "Strategy not available"
                    }
                else:
                    # Fallback extraction
                    content = ""
                    if hasattr(result, 'raw'):
                        content = str(result.raw)
                    elif hasattr(result, 'result'):
                        content = str(result.result)
                    else:
                        content = str(result)
                    
                    prediction_results = {
                        "comprehensive_analysis": content,
                        "note": "Results presented in combined format"
                    }
                    
            except Exception as e:
                logger.error(f"Error processing Gemini prediction results: {e}")
                prediction_results = {
                    "raw_result": str(result)[:2000],
                    "error": f"Unexpected structure in crew result. Type: {type(result)}",
                    "traceback_hint": traceback.format_exc()[:1000]
                }
            
            # Add metadata
            prediction_results.update({
                "ticker": ticker,
                "timestamp": datetime.now().isoformat(),
                "agents_used": list(agents.keys()),
                "analysis_type": "gemini_multi_agent_prediction",
                "model": "gemini-2.0-flash"
            })
            
            logger.info(f"✓ Completed Gemini multi-agent prediction for {ticker}")
            
            return {
                "status": "success",
                "prediction": prediction_results,
                "ticker": ticker
            }
            
        except Exception as e:
            logger.error(f"✗ Gemini multi-agent prediction failed for {ticker}: {e}")
            logger.error(f"Gemini prediction error traceback: {traceback.format_exc()}")
            
            # Provide comprehensive fallback
            fallback_prediction = {
                "ticker": ticker,
                "timestamp": datetime.now().isoformat(),
                "analysis_type": "gemini_fallback_prediction",
                "model": "gemini-2.0-flash",
                "market_analysis": f"{ticker} requires technical analysis of recent price movements and volume patterns.",
                "fundamental_analysis": f"{ticker} fundamentals need evaluation including earnings, revenue growth, and competitive position.",
                "sentiment_analysis": f"{ticker} sentiment analysis should consider recent news, analyst ratings, and market perception.",
                "risk_assessment": f"{ticker} risk factors include market volatility, sector-specific risks, and company-specific challenges.",
                "investment_strategy": f"{ticker} investment decision requires combining technical, fundamental, and risk factors with current market conditions.",
                "note": "Gemini analysis encountered technical difficulties. Manual research recommended."
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
                logger.error(f"Gemini multi-agent prediction timed out for {ticker}")
                return {
                    "status": "timeout",
                    "prediction": {
                        "ticker": ticker,
                        "error": "Gemini analysis timed out",
                        "note": "Prediction analysis exceeded time limit. Try again with simpler request.",
                        "model": "gemini-2.0-flash"
                    },
                    "ticker": ticker
                }
    except Exception as e:
        logger.error(f"Gemini executor failed for {ticker} prediction: {e}")
        return {
            "status": "error",
            "prediction": {
                "ticker": ticker,
                "error": "System error during Gemini prediction",
                "note": "Gemini prediction system encountered technical difficulties.",
                "model": "gemini-2.0-flash"
            },
            "ticker": ticker,
            "error": str(e)
        }

def test_llm_thoroughly(llm):
    """Test the Gemini LLM with various inputs to ensure it works for predictions"""
    try:
        # Test 1: Simple prediction query
        result1 = llm.call("Analyze AAPL stock briefly")
        if not result1 or len(str(result1)) < 10:
            raise Exception("Gemini LLM failed prediction query test")
        
        # Test 2: Structured analysis request
        result2 = llm.call([{"role": "user", "content": "Provide a 2-sentence stock analysis"}])
        if not result2 or len(str(result2)) < 5:
            raise Exception("Gemini LLM failed structured request test")
        
        logger.info("✓ Gemini LLM passed prediction capability tests")
        return True
        
    except Exception as e:
        logger.error(f"Gemini LLM prediction test failed: {e}")
        return False

@router.get("/custom-summary")
def generate_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Generate comprehensive AI-powered stock prediction reports using Gemini multi-agent system"""
    try:
        logger.info(f"=== Starting GEMINI MULTI-AGENT stock prediction for user {current_user.id} ===")
        
        # Validate environment for Gemini
        google_api_key, serper_api_key = validate_environment()
        
        # Get followed tickers
        tickers = get_followed_stock_symbols(current_user.id, db)
        if not tickers:
            tickers = ["AAPL", "MSFT"]  # Default to major stocks for demo
            logger.info("No followed stocks found, using AAPL and MSFT as defaults")
        else:
            # Limit to prevent overwhelming analysis
            tickers = tickers[:3]  # Process up to 3 tickers for comprehensive analysis
            
        logger.info(f"Processing tickers for Gemini multi-agent prediction: {tickers}")
        
        # Initialize Gemini LLM with prediction testing
        llm = None
        max_llm_retries = 3
        
        for attempt in range(max_llm_retries):
            try:
                logger.info(f"Initializing Gemini prediction LLM (attempt {attempt + 1})")
                llm = CrewCompatibleGemini(
                    model="gemini-2.0-flash", 
                    temperature=0.1,  # Slight temperature for diverse analysis
                    google_api_key=google_api_key,
                    max_tokens=600  # Increased for comprehensive analysis
                )
                
                # Test Gemini LLM for prediction capabilities
                if test_llm_thoroughly(llm):
                    logger.info("✓ Gemini prediction LLM initialized and tested successfully")
                    break
                else:
                    raise Exception("Gemini LLM failed prediction capability tests")
                
            except Exception as e:
                logger.warning(f"Gemini LLM setup attempt {attempt + 1} failed: {e}")
                if attempt == max_llm_retries - 1:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"Failed to initialize Gemini prediction AI model after {max_llm_retries} attempts"
                    )
                time.sleep(5)  # Longer wait for prediction setup
        
        # Initialize search tools for market data
        tools = []
        try:
            if serper_api_key:
                tools.append(SerperSearchTool())
                logger.info("Market search tool initialized for Gemini predictions")
        except Exception as e:
            logger.warning(f"Search tool failed, Gemini predictions will use general knowledge: {e}")
        
        # Process each ticker with Gemini multi-agent prediction system
        prediction_reports = {}
        successful_predictions = 0
        
        for i, ticker in enumerate(tickers):
            try:
                logger.info(f"Processing Gemini prediction {i+1}/{len(tickers)}: {ticker}")
                
                # Execute comprehensive Gemini multi-agent prediction
                result = execute_stock_prediction(ticker, llm, tools, timeout_seconds=400)
                
                prediction_reports[ticker] = result
                
                if result["status"] in ["success", "fallback"]:
                    successful_predictions += 1
                    logger.info(f"✓ {ticker} Gemini prediction completed")
                else:
                    logger.warning(f"✗ {ticker} Gemini prediction had issues")
                
                # Longer pause between comprehensive predictions for Gemini rate limits
                if i < len(tickers) - 1:
                    time.sleep(10)  # Increased delay for Gemini
                    
            except Exception as e:
                logger.error(f"Exception during {ticker} Gemini prediction: {e}")
                prediction_reports[ticker] = {
                    "status": "error",
                    "prediction": {
                        "ticker": ticker,
                        "error": "Unexpected error during Gemini multi-agent prediction",
                        "timestamp": datetime.now().isoformat(),
                        "model": "gemini-2.0-flash"
                    },
                    "ticker": ticker,
                    "error": str(e)
                }
        
        # Compile comprehensive response
        response = {
            "reports": prediction_reports,
            "summary": {
                "total_tickers": len(tickers),
                "successful_predictions": successful_predictions,
                "success_rate": f"{(successful_predictions/len(tickers)*100):.1f}%" if tickers else "0%",
                "analysis_type": "gemini_multi_agent_prediction",
                "model": "gemini-2.0-flash",
                "timestamp": datetime.now().isoformat()
            },
            "status": "completed",
            "message": f"Gemini multi-agent stock prediction completed: {successful_predictions}/{len(tickers)} successful predictions"
        }
        
        logger.info(f"=== GEMINI MULTI-AGENT prediction completed: {successful_predictions}/{len(tickers)} ===")
        return response
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
        
    except Exception as e:
        logger.error(f"Critical error in Gemini multi-agent predictions: {e}")
        logger.error(f"Critical Gemini prediction traceback: {traceback.format_exc()}")
        
        # Return error response with helpful information
        return {
            "reports": {},
            "summary": {
                "total_tickers": 0,
                "successful_predictions": 0,
                "success_rate": "0%",
                "analysis_type": "gemini_multi_agent_prediction",
                "model": "gemini-2.0-flash",
                "timestamp": datetime.now().isoformat()
            },
            "status": "critical_error",
            "message": f"Gemini multi-agent prediction system encountered critical error: {str(e)}"
        }

@router.get("/test-wrapper")
def test_wrapper():
    """Test the Gemini wrapper for prediction capabilities"""
    try:
        google_api_key = os.getenv("GOOGLE_API_KEY")
        if not google_api_key:
            raise HTTPException(status_code=500, detail="Missing GOOGLE_API_KEY")
        
        # Test the Gemini wrapper with prediction-focused tests
        result = test_crew_gemini_with_detailed_logging(google_api_key)
        
        # Add prediction-specific test
        try:
            llm = CrewCompatibleGemini(
                model="gemini-2.0-flash",
                temperature=0.1,
                google_api_key=google_api_key,
                max_tokens=100
            )
            
            prediction_test = llm.call("Analyze Tesla stock in 2 sentences")
            result["prediction_test"] = {
                "status": "success" if prediction_test and len(str(prediction_test)) > 20 else "failed",
                "response": str(prediction_test)[:150] if prediction_test else "No response"
            }
            
        except Exception as e:
            result["prediction_test"] = {
                "status": "failed",
                "error": str(e)
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Gemini wrapper test failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "message": "Gemini prediction wrapper test failed"
        }

@router.get("/minimal-test")
def minimal_test():
    """Test with minimal Gemini prediction setup"""
    try:
        google_api_key = os.getenv("GOOGLE_API_KEY")
        if not google_api_key:
            return {"error": "Missing GOOGLE_API_KEY"}
        
        # Create Gemini prediction LLM
        llm = CrewCompatibleGemini(
            model="gemini-2.0-flash",
            temperature=0.0,
            google_api_key=google_api_key,
            max_tokens=80
        )
        
        # Test Gemini LLM with prediction query
        direct_result = llm.call("Give a brief bullish or bearish view on Apple stock")
        logger.info(f"Direct Gemini prediction test result: {direct_result}")
        
        # Minimal prediction agent test with Gemini
        prediction_agent = Agent(
            role="Stock Predictor",
            goal="Provide brief stock predictions",
            backstory="You are a stock analyst who gives concise predictions.",
            llm=llm,
            verbose=False,
            allow_delegation=False,
            memory=False,
            max_iter=1,
            max_retry_limit=0
        )
        
        prediction_task = Task(
            description="Say whether AAPL stock is 'BUY', 'HOLD', or 'SELL' with 1 sentence reason.",
            expected_output="One word recommendation plus one sentence explanation.",
            agent=prediction_agent
        )
        
        crew = Crew(
            agents=[prediction_agent],
            tasks=[prediction_task],
            verbose=False,
            memory=False,
            cache=False
        )
        
        crew_result = crew.kickoff()
        
        return {
            "status": "success",
            "model": "gemini-2.0-flash",
            "direct_prediction_result": str(direct_result)[:150],
            "crew_prediction_result": str(crew_result)[:150],
            "message": "Minimal Gemini prediction test completed"
        }
        
    except Exception as e:
        logger.error(f"Minimal Gemini prediction test failed: {e}")
        logger.error(f"Minimal Gemini prediction test traceback: {traceback.format_exc()}")
        return {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()[:500],
            "model": "gemini-2.0-flash"
        }