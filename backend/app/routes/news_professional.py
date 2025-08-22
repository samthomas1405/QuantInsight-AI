from fastapi import APIRouter, Depends, HTTPException, Query
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
from concurrent.futures import ThreadPoolExecutor, TimeoutError, as_completed
import time
from datetime import datetime, timedelta
import json
from typing import Dict, List, Any, Optional
import re

try:
    from dateutil import parser as date_parser
except ImportError:
    date_parser = None

from app.crew_groq_wrapper import CrewCompatibleGemini

load_dotenv()
router = APIRouter()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def validate_environment():
    """Validate required environment variables"""
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        raise HTTPException(status_code=500, detail="Missing GOOGLE_API_KEY environment variable")
    
    serper_api_key = os.getenv("SERPER_API_KEY")
    if not serper_api_key:
        logger.warning("SERPER_API_KEY not found, search functionality may be limited")
    
    return google_api_key, serper_api_key

def create_professional_agents(llm, tools):
    """Create agents with professional equity research focus"""
    
    # Technical Analyst - Focused on concrete levels
    technical_analyst = Agent(
        role="Senior Technical Analyst",
        goal="Identify precise price levels, indicators, and technical setups",
        backstory="""You are a technical analyst at a major investment bank. You provide specific price levels, 
        indicator readings, and chart patterns. Always include numbers: support/resistance levels, moving averages, 
        RSI values, volume changes. Never use vague terms. Format: brief bullets with exact figures.""",
        llm=llm,
        tools=tools,
        verbose=False,
        max_execution_time=60,
        allow_delegation=False,
        memory=False,
        max_iter=1
    )
    
    # Fundamental Analyst - Numbers-driven
    fundamental_analyst = Agent(
        role="Equity Research Analyst",
        goal="Analyze financial metrics and valuation with specific numbers",
        backstory="""You cover stocks for institutional clients. Focus on concrete metrics: revenue growth %, 
        EBITDA margins, P/E ratios, FCF yield, debt/equity. One key driver per analysis. Be specific with 
        quarters (Q3'24) and comparisons (vs 15% industry avg). No generic statements.""",
        llm=llm,
        tools=tools,
        verbose=False,
        max_execution_time=60,
        allow_delegation=False,
        memory=False,
        max_iter=1
    )
    
    # Sentiment Analyst - Time-specific
    sentiment_analyst = Agent(
        role="Market Sentiment Specialist",
        goal="Track recent sentiment shifts with specific timeframes",
        backstory="""You monitor news flow and analyst actions for a trading desk. Always specify timeframes: 
        'past 5 days', 'since Nov 15', 'following Q3 earnings'. Mention specific sources when possible: 
        'Goldman upgrade to Buy', '3 of 5 analysts'. Focus on direction and recency.""",
        llm=llm,
        tools=tools,
        verbose=False,
        max_execution_time=60,
        allow_delegation=False,
        memory=False,
        max_iter=1
    )
    
    # Risk Analyst - Specific scenarios
    risk_analyst = Agent(
        role="Risk Management Director",
        goal="Identify specific, actionable risks with clear triggers",
        backstory="""You assess portfolio risks for a hedge fund. List 3-5 specific risks, not generic market risks. 
        Examples: 'FDA decision on XYZ drug by Jan 15', 'Debt refinancing due Q1 at higher rates', 
        'China revenue 30% of total exposed to tariffs'. Each risk should be distinct and measurable.""",
        llm=llm,
        tools=tools,
        verbose=False,
        max_execution_time=60,
        allow_delegation=False,
        memory=False,
        max_iter=1
    )
    
    # Strategy Synthesizer - Action-oriented
    strategy_synthesizer = Agent(
        role="Portfolio Strategy Head",
        goal="Synthesize analysis into specific, non-prescriptive positioning notes",
        backstory="""You write strategy notes for professional investors. Frame opportunities without prescribing. 
        Include specific levels to monitor. Examples: 'Watch for break above 52 with volume', 
        'Consider hedges if drops below 200-DMA at 47.50', 'Earnings catalyst Feb 8 could clarify guidance'.""",
        llm=llm,
        tools=tools,
        verbose=False,
        max_execution_time=60,
        allow_delegation=False,
        memory=False,
        max_iter=1
    )
    
    return {
        "technical_analyst": technical_analyst,
        "fundamental_analyst": fundamental_analyst,
        "sentiment_analyst": sentiment_analyst,
        "risk_analyst": risk_analyst,
        "strategy_synthesizer": strategy_synthesizer
    }

def create_professional_tasks(ticker: str, agents: Dict[str, Agent]):
    """Create focused tasks that produce structured output"""
    
    overview_task = Task(
        description=f"""Create a comprehensive 3-4 sentence overview of {ticker} current position. 
        Include: 1) Price action and trend context 2) Key technical level 3) Fundamental driver 4) Near-term catalyst
        Example: 'AAPL consolidates near 189 after failing to break 192 resistance for third consecutive session. 
        The stock trades 5% below 50-DMA at 192.15, maintaining uptrend support at 185. 
        Q3 earnings showed resilient 28% operating margins despite 3% revenue deceleration. 
        March product event and Q1 guidance on Feb 2 are key upcoming catalysts.'
        Target 80-100 words. Include at least 3 specific numbers/dates.""",
        agent=agents["strategy_synthesizer"],
        expected_output="Comprehensive 3-4 sentence overview with price, fundamentals, and catalysts"
    )
    
    technical_task = Task(
        description=f"""Provide detailed technical analysis of {ticker} with 3-4 key observations:
        • Current price relative to key moving averages (20/50/200-DMA)
        • Support and resistance levels with volume context
        • Momentum indicators (RSI, MACD) with specific readings
        • Chart pattern or trend structure if applicable
        Example format:
        • Trading at 189.50, between 50-DMA resistance at 192.15 and 200-DMA support at 185.20
        • Volume declining 20% past week, suggesting consolidation before directional move
        • RSI at 42 approaching oversold, while MACD histogram narrowing toward bullish cross
        • Ascending triangle pattern forming with apex near 193, breakout target 201
        Each bullet 15-25 words. Must include specific levels and percentages.""",
        agent=agents["technical_analyst"],
        expected_output="3-4 detailed technical observations with specific levels and indicators"
    )
    
    fundamental_task = Task(
        description=f"""Analyze {ticker} fundamentals comprehensively in 3-4 sentences covering:
        1) Revenue/earnings growth trajectory with YoY and sequential comparisons
        2) Margin profile and operational efficiency metrics
        3) Valuation relative to historical ranges and peer group
        4) Balance sheet strength or concerns
        Example: 'Revenue growth decelerated to 3% YoY in Q3 from 8% in Q2, though beat consensus by 2%. 
        EBITDA margins expanded 120bps to 31.5% on cost discipline, highest in 8 quarters. 
        Stock trades at 28x forward P/E vs 5-year average of 24x and software peers at 32x. 
        Net cash position of $45B provides flexibility for capital allocation.'
        Target 70-90 words with specific metrics.""",
        agent=agents["fundamental_analyst"],
        expected_output="3-4 sentences covering growth, margins, valuation, and balance sheet"
    )
    
    sentiment_task = Task(
        description=f"""Assess {ticker} recent sentiment in 1-2 sentences. Include timeframe and direction.
        Example: 'Sentiment turned negative past week following guidance cut. Three analysts lowered targets, 
        average now $45 from $52.'
        Maximum 35 words. Must specify timeframe (past X days/weeks).""",
        agent=agents["sentiment_analyst"],
        expected_output="Brief sentiment assessment with specific timeframe"
    )
    
    risk_task = Task(
        description=f"""List 3-5 specific risks for {ticker}. Each risk must be:
        • Distinct (no overlaps)
        • Specific to company or situation
        • 6-18 words each
        • Actionable/measurable
        Format as bullet list. Examples:
        • Q4 earnings Feb 15 may miss lowered guidance
        • $2B debt refinancing due March at higher rates
        • Apple orders 40% of revenue face iPhone slowdown
        • Regulatory review of merger closes January 30
        • Key patent expires Q2 opening generic competition""",
        agent=agents["risk_analyst"],
        expected_output="Bullet list of 3-5 specific, measurable risks"
    )
    
    strategy_task = Task(
        description=f"""Create 2-3 strategy bullets for {ticker}. Frame as observations, not advice.
        Each bullet 10-18 words. Include one specific level to monitor.
        Examples:
        • Break above 52-week high 67.30 would signal trend change
        • February earnings could clarify margin expansion trajectory
        • Consider hedges if support at 45 fails on volume
        No prescriptive language. Focus on levels and catalysts.""",
        agent=agents["strategy_synthesizer"],
        expected_output="2-3 strategy bullets with specific levels/dates"
    )
    
    return [overview_task, technical_task, fundamental_task, sentiment_task, risk_task, strategy_task]

def post_process_content(content: str, section_type: str, max_length: int = None) -> str:
    """Clean and validate content to ensure completeness"""
    
    # Remove any markdown artifacts
    content = re.sub(r'\*{1,2}', '', content)
    content = re.sub(r'#{1,6}\s*', '', content)
    content = re.sub(r'\[|\]|\(|\)', '', content)
    
    # Clean up whitespace
    content = re.sub(r'\s+', ' ', content)
    content = content.strip()
    
    # Remove trailing conjunctions
    content = re.sub(r'\s+(and|or|but|however|therefore|thus)\s*$', '.', content)
    
    # Ensure sentences end with periods
    if content and not content[-1] in '.!?':
        content += '.'
    
    # Handle bullet points
    if section_type in ['risks', 'strategy', 'technical']:
        lines = content.split('\n')
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            if line.startswith(('•', '-', '*', '·')):
                line = '• ' + line[1:].strip()
            elif line and not line.startswith('•'):
                line = '• ' + line
            
            # Ensure bullet ends with period
            if line and not line[-1] in '.!?':
                line += '.'
                
            if line and len(line.strip()) > 3:
                cleaned_lines.append(line)
        
        content = '\n'.join(cleaned_lines)
    
    # Enforce max length if specified (with higher limits for expanded sections)
    if max_length and len(content) > max_length:
        # For longer sections, allow slightly over limit to complete sentence
        if section_type in ['overview', 'fundamental', 'technical'] and len(content) < max_length + 50:
            # Allow completion of current sentence
            pass
        else:
            # Try to cut at sentence boundary
            sentences = content.split('. ')
            truncated = ''
            for sent in sentences:
                if len(truncated) + len(sent) + 2 <= max_length:
                    truncated += sent + '. '
                else:
                    break
            content = truncated.rstrip()
    
    # Final validation - if empty, return placeholder
    if not content or len(content.strip()) < 10:
        if section_type == 'overview':
            return f"Analysis in progress. Check back shortly."
        elif section_type == 'technical':
            return "• Technical data not available.\n• Check back for updates."
        elif section_type == 'fundamental':
            return "Fundamental metrics not available."
        elif section_type == 'sentiment':
            return "Recent sentiment data not available."
        elif section_type == 'risks':
            return "• Market volatility risk.\n• Sector rotation risk.\n• Execution risk."
        elif section_type == 'strategy':
            return "• Monitor price action.\n• Review after next earnings."
    
    return content

def structure_report(ticker: str, task_outputs: List[Any]) -> Dict[str, Any]:
    """Structure the analysis into clean JSON format"""
    
    # Extract content from each task
    overview = ""
    technical = ""
    fundamental = ""
    sentiment = ""
    risks = []
    strategy = []
    
    try:
        # Map task outputs to sections
        if len(task_outputs) > 0:
            overview = post_process_content(str(task_outputs[0]), 'overview', 300)  # Increased for 3-4 sentences
        
        if len(task_outputs) > 1:
            technical = post_process_content(str(task_outputs[1]), 'technical')
            # Parse technical bullets
            tech_lines = [line.strip() for line in technical.split('\n') if line.strip()]
            technical = tech_lines
        
        if len(task_outputs) > 2:
            fundamental = post_process_content(str(task_outputs[2]), 'fundamental', 250)  # Increased for comprehensive analysis
        
        if len(task_outputs) > 3:
            sentiment = post_process_content(str(task_outputs[3]), 'sentiment', 120)
        
        if len(task_outputs) > 4:
            risk_content = post_process_content(str(task_outputs[4]), 'risks')
            risks = [line.strip()[2:].strip() for line in risk_content.split('\n') 
                    if line.strip().startswith('•')][:5]  # Max 5 risks
        
        if len(task_outputs) > 5:
            strategy_content = post_process_content(str(task_outputs[5]), 'strategy')
            strategy = [line.strip()[2:].strip() for line in strategy_content.split('\n') 
                       if line.strip().startswith('•')][:3]  # Max 3 strategies
    
    except Exception as e:
        logger.error(f"Error structuring report: {e}")
    
    # Extract key levels from technical analysis
    key_levels = {}
    full_technical = '\n'.join(technical) if isinstance(technical, list) else technical
    
    # Extract moving averages
    ma_patterns = [
        r'(\d+)-DMA?\s+(?:at\s+)?(\d+\.?\d*)',
        r'MA\s*\(?\s*(\d+)\s*\)?\s+(?:at\s+)?(\d+\.?\d*)'
    ]
    for pattern in ma_patterns:
        matches = re.findall(pattern, full_technical, re.IGNORECASE)
        for match in matches:
            key_levels[f"{match[0]}-DMA"] = float(match[1])
    
    # Extract support/resistance
    sr_pattern = r'(support|resistance|Support|Resistance)\s+(?:at\s+)?(\d+\.?\d*)'
    sr_matches = re.findall(sr_pattern, full_technical, re.IGNORECASE)
    for match in sr_matches:
        key_levels[match[0].capitalize()] = float(match[1])
    
    return {
        "ticker": ticker,
        "sections": {
            "overview": overview,
            "market_analysis": technical,
            "fundamental_analysis": fundamental,
            "sentiment_snapshot": sentiment,
            "risk_assessment": risks,
            "strategy_note": strategy
        },
        "meta": {
            "generated_at": datetime.now().isoformat(),
            "key_levels": key_levels
        }
    }

def execute_professional_analysis(ticker: str, llm, tools, timeout_seconds: int = 180) -> Dict[str, Any]:
    """Execute structured analysis with post-processing"""
    
    def run_analysis():
        try:
            logger.info(f"Starting professional analysis for {ticker}")
            
            # Create agents and tasks
            agents = create_professional_agents(llm, tools)
            tasks = create_professional_tasks(ticker, agents)
            
            # Create crew
            crew = Crew(
                agents=list(agents.values()),
                tasks=tasks,
                verbose=False,
                process="sequential",
                max_iterations=1
            )
            
            # Execute
            result = crew.kickoff()
            
            # Structure the report
            if hasattr(result, 'tasks_output'):
                report = structure_report(ticker, result.tasks_output)
            else:
                # Fallback
                report = structure_report(ticker, [str(result)])
            
            return {
                "status": "success",
                "ticker": ticker,
                "prediction": report
            }
            
        except Exception as e:
            logger.error(f"Analysis failed for {ticker}: {e}")
            # Return structured fallback
            return {
                "status": "error",
                "ticker": ticker,
                "prediction": {
                    "ticker": ticker,
                    "sections": {
                        "overview": "Analysis temporarily unavailable. Please try again.",
                        "market_analysis": ["Technical data pending."],
                        "fundamental_analysis": "Fundamental data pending.",
                        "sentiment_snapshot": "Sentiment data pending.",
                        "risk_assessment": ["General market risk.", "Volatility risk."],
                        "strategy_note": ["Monitor price action.", "Review after data available."]
                    },
                    "meta": {
                        "generated_at": datetime.now().isoformat(),
                        "key_levels": {}
                    }
                }
            }
    
    # Execute with timeout
    try:
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(run_analysis)
            result = future.result(timeout=timeout_seconds)
            return result
    except TimeoutError:
        logger.error(f"Analysis timed out for {ticker}")
        return {
            "status": "timeout",
            "ticker": ticker,
            "prediction": {
                "ticker": ticker,
                "sections": {
                    "overview": "Analysis timed out. Please try again.",
                    "market_analysis": ["Technical data unavailable."],
                    "fundamental_analysis": "Fundamental data unavailable.",
                    "sentiment_snapshot": "Sentiment data unavailable.",
                    "risk_assessment": ["Analysis timeout risk."],
                    "strategy_note": ["Retry analysis when available."]
                },
                "meta": {
                    "generated_at": datetime.now().isoformat(),
                    "key_levels": {}
                }
            }
        }

def execute_parallel_professional_analysis(
    ticker_list: List[str], 
    llm, 
    tools, 
    max_workers: int = 3
) -> Dict[str, Any]:
    """Execute professional analysis for multiple tickers in parallel"""
    
    results = {}
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_ticker = {
            executor.submit(execute_professional_analysis, ticker, llm, tools, 180): ticker 
            for ticker in ticker_list
        }
        
        for future in as_completed(future_to_ticker, timeout=600):
            ticker = future_to_ticker[future]
            try:
                result = future.result()
                results[ticker] = result
                logger.info(f"✓ Completed professional analysis for {ticker}")
            except Exception as e:
                logger.error(f"✗ Failed analysis for {ticker}: {e}")
                results[ticker] = {
                    "status": "error",
                    "ticker": ticker,
                    "prediction": {
                        "ticker": ticker,
                        "sections": {
                            "overview": "Analysis failed. Please retry.",
                            "market_analysis": ["Data unavailable."],
                            "fundamental_analysis": "Data unavailable.",
                            "sentiment_snapshot": "Data unavailable.",
                            "risk_assessment": ["Technical error."],
                            "strategy_note": ["Retry required."]
                        },
                        "meta": {
                            "generated_at": datetime.now().isoformat(),
                            "key_levels": {}
                        }
                    }
                }
    
    end_time = time.time()
    logger.info(f"Parallel professional analysis completed in {end_time - start_time:.2f}s")
    
    return results

@router.get("/custom-summary")
def generate_professional_reports(
    tickers: Optional[str] = Query(None, description="Comma-separated list of tickers"),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Generate professional equity research reports"""
    try:
        logger.info(f"Starting professional analysis for user {current_user.id}")
        
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
            else:
                ticker_list = ticker_list[:5]  # Limit to 5
        
        # Initialize LLM
        llm = CrewCompatibleGemini(
            model="gemini-2.0-flash", 
            temperature=0.3,  # Lower temperature for consistency
            google_api_key=google_api_key,
            max_tokens=400  # Sufficient for concise responses
        )
        
        # Initialize tools
        tools = []
        if serper_api_key:
            tools.append(SerperSearchTool())
        
        # Execute analysis
        start_time = time.time()
        
        prediction_reports = execute_parallel_professional_analysis(
            ticker_list, 
            llm, 
            tools, 
            max_workers=min(3, len(ticker_list))
        )
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Count successful
        successful = sum(1 for r in prediction_reports.values() if r.get("status") == "success")
        
        # Response
        response = {
            "reports": prediction_reports,
            "summary": {
                "total_tickers": len(ticker_list),
                "successful_predictions": successful,
                "analysis_type": "professional_equity_research",
                "execution_time_seconds": round(total_time, 2),
                "timestamp": datetime.now().isoformat()
            },
            "status": "completed"
        }
        
        logger.info(f"Professional analysis completed in {total_time:.2f}s")
        return response
        
    except Exception as e:
        logger.error(f"Critical error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return {
            "reports": {},
            "summary": {
                "total_tickers": 0,
                "successful_predictions": 0,
                "analysis_type": "professional_equity_research",
                "execution_time_seconds": 0,
                "timestamp": datetime.now().isoformat()
            },
            "status": "error",
            "message": str(e)
        }