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
from dotenv import load_dotenv
import asyncio
from concurrent.futures import ThreadPoolExecutor, TimeoutError, as_completed
import time
from datetime import datetime, timedelta
import json
from typing import Dict, List, Any, Optional, AsyncGenerator
import re
from enum import Enum

class AnalysisStep(Enum):
    INIT = "init"
    FETCH_CONTEXT = "fetch_context"
    MARKET_ANALYSIS = "market_analysis"
    FUNDAMENTAL_ANALYSIS = "fundamental_analysis"
    SENTIMENT_ANALYSIS = "sentiment_analysis"
    RISK_ASSESSMENT = "risk_assessment"
    STRATEGY_NOTE = "strategy_note"
    VALIDATION = "validation"
    COMPLETE = "complete"

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
        max_execution_time=30,  # Reduced from 60 to 30 seconds
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
        max_execution_time=30,  # Reduced from 60 to 30 seconds
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
        max_execution_time=30,  # Reduced from 60 to 30 seconds
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
        max_execution_time=30,  # Reduced from 60 to 30 seconds
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
        max_execution_time=30,  # Reduced from 60 to 30 seconds
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
        description=f"""Provide comprehensive technical analysis of {ticker} with 5-7 detailed bullets, each 18-28 words.
        EVERY bullet must include at least one concrete metric: specific price level, indicator reading, volume metric, or timeframe.
        
        Required elements across all bullets:
        • Current price vs 20/50/200-DMA with exact levels
        • Support and resistance levels with volume context
        • RSI and MACD readings with specific values
        • Volume trends vs 20-day average
        • ATR or volatility metrics
        • Gap levels or pattern formations
        • Relative strength vs sector/market
        
        Example bullets:
        • Trading at 189.50, testing 50-DMA resistance at 192.15 after bouncing from 200-DMA support at 185.20 on 1.2x average volume
        • RSI at 42 approaching oversold territory while MACD histogram narrows from -0.45 to -0.12, signaling potential bullish momentum shift ahead
        • Volume declined 20% past week to 12.5M daily average, suggesting consolidation phase before next directional move above 193 resistance
        • ATR expanded to 3.2 from 2.1 monthly average, indicating increased volatility following earnings gap up from 182 to 189 level
        • Relative strength index versus SPX improved to 1.08 from 0.94, outperforming broader market by 14% over past 20 sessions
        
        Output exactly 5-7 bullets. Each bullet 18-28 words with specific numbers.""",
        agent=agents["technical_analyst"],
        expected_output="5-7 detailed technical bullets, each 18-28 words with concrete metrics"
    )
    
    fundamental_task = Task(
        description=f"""Analyze {ticker} fundamentals in one cohesive paragraph of 120-180 words (3-5 sentences).
        
        MUST include at least 4 concrete fundamentals from:
        • Revenue growth (YoY and QoQ) with specific percentages
        • EPS growth and trajectory
        • Margin trends (gross, operating, EBITDA) with basis points changes
        • Free cash flow generation and conversion
        • Net cash/debt position with amounts
        • Valuation multiples (P/E, EV/EBITDA, P/S) vs historical and peers
        • Guidance changes or management commentary
        • Segment performance or geographic mix
        • Capital allocation (capex, buybacks, dividends)
        
        MUST include at least 3 specific numbers (percentages or currency amounts) with time periods (Q3'24, TTM, FY24E).
        
        Example: 'Revenue accelerated to 12% YoY growth in Q3'24 from 8% in Q2'24, driven by cloud segment expanding 28% to $4.2B. Operating margins improved 150bps to 32.5% on disciplined cost management, while EPS grew 18% to $1.47 beating consensus by $0.08. The company generated $2.8B in quarterly FCF (23% margin), supporting the increased $15B buyback authorization. Trading at 25x forward P/E versus 5-year average of 22x and tech peers at 28x, valuation remains reasonable given 15% projected EPS CAGR through FY26. Net cash stands at $48B after Q3 providing strategic flexibility for M&A or incremental capital returns.'
        
        Output 120-180 words in paragraph form. No bullet points.""",
        agent=agents["fundamental_analyst"],
        expected_output="One paragraph of 120-180 words with 4+ fundamentals and 3+ specific numbers"
    )
    
    sentiment_task = Task(
        description=f"""Assess {ticker} sentiment comprehensively in 80-120 words (2-3 sentences).
        
        MUST reference:
        • Specific recency windows (last 7 days, past 2 weeks, since [date])
        • Direction of sentiment shift with counts when available
        • Analyst actions (upgrades/downgrades) with firms and targets
        • News tone with headline themes
        • Social media or options flow indicators if relevant
        
        Example: 'Sentiment shifted markedly positive over the past 10 days following strong Q3 results, with 8 positive headlines versus 2 cautionary notes in major financial media. Goldman Sachs and Morgan Stanley both upgraded to Buy with $210 and $205 targets respectively, while Barclays maintained Hold but raised target to $195 from $180. Options flow shows bullish skew with 2.3x call volume over puts in the past week, particularly concentrated in Feb $200 strikes. Retail investor mentions increased 45% on investment forums, though some profit-taking evident above $190 resistance.'
        
        If data is limited, acknowledge briefly but still provide full snapshot.
        Output 80-120 words total.""",
        agent=agents["sentiment_analyst"],
        expected_output="2-3 sentences totaling 80-120 words with specific timeframes and counts"
    )
    
    risk_task = Task(
        description=f"""List exactly 5 specific risks for {ticker} with varied depth:
        
        FIRST THREE RISKS (16-28 words each) - must be analytical with specific mechanisms:
        • Include specific metrics, thresholds, or percentages
        • Reference concrete timeframes or trigger events
        • Explain the mechanism of risk impact
        
        Examples of first three (deeper):
        • Interest margin compression of 20-30bps expected if Fed funds exceed 5.5%, pressuring FY24 EPS by estimated $0.15-0.20 per share
        • China revenue concentration at 31% of total sales faces regulatory headwinds, with potential 15% impact if restrictions mirror competitor bans
        • $4.5B debt maturity in March 2025 requires refinancing at 200bps higher rates, increasing annual interest expense by $90M
        
        LAST TWO RISKS (8-16 words each) - more concise but still specific:
        • Key patent cliff in Q3 opens $800M revenue to competition
        • Supply chain delays could impact 20% of Q1 deliveries
        
        Output exactly 5 risks following this structure.""",
        agent=agents["risk_analyst"],
        expected_output="5 risks: first 3 at 16-28 words with mechanisms, last 2 at 8-16 words"
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

def validate_content(content: str, section_type: str) -> tuple[bool, str]:
    """Validate content meets requirements. Returns (is_valid, error_message)"""
    
    if not content or len(content.strip()) < 10:
        return False, f"{section_type} content is empty or too short"
    
    # Check for obvious cut-offs first
    cut_off_patterns = [
        r'\$\s*$',  # Ends with $ and no number
        r'the\s+$',  # Ends with "the"
        r'a\s+$',    # Ends with "a"
        r'is\s+$',   # Ends with "is"
        r'at\s+$',   # Ends with "at"
        r'\d+\s*$',  # Ends with number but no unit/context
        r':\s*$',    # Ends with colon
        r',\s*$',    # Ends with comma
    ]
    
    for pattern in cut_off_patterns:
        if re.search(pattern, content):
            return False, f"Content appears cut off: ends with incomplete pattern"
    
    # Count words
    word_count = len(content.split())
    
    # Relaxed validation for cut-off content
    if section_type == 'technical':
        # Even if cut off, accept what we have if it's substantial
        bullets = [line.strip() for line in content.split('\n') if line.strip()]
        if len(bullets) == 0:
            return False, "No technical content found"
        # Don't enforce exact bullet count if content was cut
                
    elif section_type == 'fundamental':
        # Accept shorter content if it was cut off
        if word_count < 20:
            return False, f"Fundamentals too short, got {word_count} words"
            
    elif section_type == 'sentiment':
        # Accept shorter sentiment if cut off
        if word_count < 20:
            return False, f"Sentiment too short, got {word_count} words"
            
    elif section_type == 'risks':
        bullets = [line.strip() for line in content.split('\n') if line.strip()]
        if len(bullets) == 0:
            return False, "No risk content found"
    
    # Final check for obvious incompleteness
    if content.endswith(('and', 'or', 'but', 'however', 'therefore', 'thus')):
        return False, "Content ends with conjunction"
    
    return True, ""

def get_fallback_content(section_type: str) -> str:
    """Get appropriate fallback content for each section type"""
    fallbacks = {
        'overview': "Comprehensive analysis is being compiled. Price action shows consolidation near recent levels with technical indicators suggesting neutral momentum. Fundamental metrics are being evaluated across multiple reporting periods to provide accurate assessment.",
        'technical': "• Trading near 50-day moving average with support and resistance levels being calculated from recent price action.\n• Volume patterns suggest accumulation phase with average daily volume requiring further validation.\n• RSI at neutral levels indicating neither overbought nor oversold conditions in current timeframe.\n• MACD histogram showing convergence pattern suggesting potential directional move ahead.\n• Relative strength versus sector benchmarks being computed for comparative analysis.",
        'fundamental': "Revenue growth metrics and margin trends are being analyzed across recent reporting periods. Earnings trajectory shows consistency with sector averages pending detailed financial statement review. Valuation multiples require comparison against both historical ranges and current peer group metrics. Balance sheet strength indicators including cash position and debt ratios are being calculated. Capital allocation strategies and segment performance data need comprehensive evaluation for complete fundamental picture.",
        'sentiment': "Market sentiment analysis over the past two weeks indicates mixed signals with both positive and negative catalysts impacting investor perception. Recent analyst actions show divergent views with price target revisions reflecting uncertainty about near-term prospects. News flow has been moderate with earnings-related updates and sector developments driving sentiment shifts. Social media indicators and options positioning data suggest cautious optimism among retail and institutional investors.",
        'risks': "• Macroeconomic headwinds could impact valuation multiples by 15-20% if broader market correction materializes.\n• Competitive pressures intensifying with new market entrants potentially affecting market share dynamics.\n• Regulatory environment remains uncertain with potential policy changes impacting operational flexibility.\n• Technology disruption accelerating faster than anticipated in core business segments.\n• Execution risks around strategic initiatives with timeline dependencies.",
        'strategy': "• Monitor key support levels for potential entry opportunities.\n• Watch for catalyst events including earnings releases and product announcements.\n• Consider position sizing based on risk tolerance and market conditions."
    }
    return fallbacks.get(section_type, "Data temporarily unavailable.")

def post_process_content(content: str, section_type: str, max_length: int = None) -> str:
    """Clean and validate content to ensure completeness"""
    
    # Handle empty content first
    if not content or len(content.strip()) < 5:
        return get_fallback_content(section_type)
    
    # Remove markdown more carefully - preserve text inside asterisks
    content = re.sub(r'\*\*([^*]+)\*\*', r'\1', content)  # **text** -> text
    content = re.sub(r'\*([^*]+)\*', r'\1', content)      # *text* -> text
    content = re.sub(r'#{1,6}\s*', '', content)           # Remove headers
    content = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', content)  # [text](url) -> text
    
    # Clean up whitespace
    content = re.sub(r'\s+', ' ', content)
    content = content.strip()
    
    # Check for obvious cut-offs before processing
    if len(content) < 20 and section_type not in ['strategy', 'risks']:
        logger.warning(f"Content too short for {section_type}: {content}")
        return get_fallback_content(section_type)
    
    # Remove trailing conjunctions and incomplete sentences
    content = re.sub(r'\s+(and|or|but|however|therefore|thus|with|at|to|from|the|a)\s*$', '', content)
    
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
    
    # Validate content
    is_valid, error_msg = validate_content(content, section_type)
    
    # If validation fails, return appropriate placeholder
    if not is_valid:
        logger.warning(f"Content validation failed for {section_type}: {error_msg}")
        logger.warning(f"Original content: {content[:200]}...")
        return get_fallback_content(section_type)
    
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
        # Map task outputs to sections with enhanced processing
        if len(task_outputs) > 0:
            overview = post_process_content(str(task_outputs[0]), 'overview')
        
        if len(task_outputs) > 1:
            technical = post_process_content(str(task_outputs[1]), 'technical')
            # Parse technical bullets - should be 5-7 bullets
            tech_lines = [line.strip() for line in technical.split('\n') if line.strip() and line.strip().startswith('•')]
            technical = tech_lines[:7]  # Max 7 bullets
        
        if len(task_outputs) > 2:
            fundamental = post_process_content(str(task_outputs[2]), 'fundamental')
        
        if len(task_outputs) > 3:
            sentiment = post_process_content(str(task_outputs[3]), 'sentiment')
        
        if len(task_outputs) > 4:
            risk_content = post_process_content(str(task_outputs[4]), 'risks')
            risks = [line.strip()[2:].strip() for line in risk_content.split('\n') 
                    if line.strip().startswith('•')][:5]  # Exactly 5 risks
        
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

def execute_professional_analysis_with_progress(
    ticker: str, 
    llm, 
    tools, 
    progress_callback=None,
    timeout_seconds: int = 60  # Reduced from 120 to 60 seconds for faster execution
) -> Dict[str, Any]:
    """Execute structured analysis with parallel task execution"""
    
    def update_progress(step: AnalysisStep, percentage: float):
        if progress_callback:
            progress_callback(ticker, step, percentage)
    
    def execute_single_task(agents: Dict[str, Agent], agent_key: str, task, step: AnalysisStep, progress_value: float):
        """Execute a single task and return its result"""
        try:
            # Create a minimal crew for this single task
            single_crew = Crew(
                agents=[agents[agent_key]],
                tasks=[task],
                verbose=False,
                process="sequential",
                max_iterations=1
            )
            
            result = single_crew.kickoff()
            update_progress(step, progress_value)
            
            # Extract the actual output
            if hasattr(result, 'tasks_output') and result.tasks_output:
                return str(result.tasks_output[0])
            else:
                return str(result)
                
        except Exception as e:
            logger.error(f"Task failed for {agent_key}: {e}")
            return None
    
    def run_analysis():
        try:
            logger.info(f"Starting parallel professional analysis for {ticker}")
            update_progress(AnalysisStep.INIT, 0.05)
            
            # Create agents
            update_progress(AnalysisStep.FETCH_CONTEXT, 0.10)
            agents = create_professional_agents(llm, tools)
            
            # Create all tasks
            all_tasks = create_professional_tasks(ticker, agents)
            
            # Map tasks to agents and progress steps
            task_mapping = [
                ("strategy_synthesizer", all_tasks[0], AnalysisStep.FETCH_CONTEXT, 0.25),  # overview
                ("technical_analyst", all_tasks[1], AnalysisStep.MARKET_ANALYSIS, 0.40),    # technical
                ("fundamental_analyst", all_tasks[2], AnalysisStep.FUNDAMENTAL_ANALYSIS, 0.55), # fundamental
                ("sentiment_analyst", all_tasks[3], AnalysisStep.SENTIMENT_ANALYSIS, 0.70),    # sentiment
                ("risk_analyst", all_tasks[4], AnalysisStep.RISK_ASSESSMENT, 0.85),           # risk
                ("strategy_synthesizer", all_tasks[5], AnalysisStep.STRATEGY_NOTE, 0.95)      # strategy
            ]
            
            # Execute all tasks in parallel
            task_results = [None] * 6
            with ThreadPoolExecutor(max_workers=6) as executor:
                # Submit all tasks
                future_to_index = {}
                for i, (agent_key, task, step, progress) in enumerate(task_mapping):
                    future = executor.submit(execute_single_task, agents, agent_key, task, step, progress)
                    future_to_index[future] = i
                
                # Collect results as they complete
                for future in as_completed(future_to_index, timeout=timeout_seconds):
                    index = future_to_index[future]
                    try:
                        result = future.result()
                        task_results[index] = result
                    except Exception as e:
                        logger.error(f"Task {index} failed: {e}")
                        task_results[index] = None
            
            # Validation step
            update_progress(AnalysisStep.VALIDATION, 0.98)
            
            # Structure the report with the parallel results
            report = structure_report(ticker, task_results)
            
            update_progress(AnalysisStep.COMPLETE, 1.0)
            
            return {
                "status": "success",
                "ticker": ticker,
                "prediction": report
            }
            
        except Exception as e:
            logger.error(f"Parallel analysis failed for {ticker}: {e}")
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

def execute_professional_analysis(ticker: str, llm, tools, timeout_seconds: int = 60) -> Dict[str, Any]:
    """Execute structured analysis with post-processing (backward compatibility)"""
    return execute_professional_analysis_with_progress(ticker, llm, tools, None, timeout_seconds)

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
            executor.submit(execute_professional_analysis, ticker, llm, tools, 60): ticker 
            for ticker in ticker_list
        }
        
        for future in as_completed(future_to_ticker, timeout=180):  # Reduced from 300 to 180 seconds
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
        
        # Initialize LLM (optimized for speed)
        llm = CrewCompatibleGemini(
            model="gemini-2.0-flash", 
            temperature=0.1,  # Lower for faster, more deterministic responses
            google_api_key=google_api_key,
            max_tokens=400  # Further reduced for speed while maintaining quality
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
            max_workers=min(10, len(ticker_list))  # Further increased parallelism for faster execution
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

@router.get("/custom-summary-stream")
async def generate_professional_reports_stream(
    tickers: Optional[str] = Query(None, description="Comma-separated list of tickers"),
    token: Optional[str] = Query(None, description="Auth token for SSE"),
    db: Session = Depends(get_db)
):
    """Generate professional equity research reports with progress streaming"""
    
    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # Authenticate using token from query parameter
            if not token:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Authentication required'})}\n\n"
                return
            
            # Get current user from token
            from app.auth import decode_access_token
            payload = decode_access_token(token)
            user_id = payload.get("sub")
            if not user_id:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Invalid token'})}\n\n"
                return
            
            # Validate environment
            google_api_key, serper_api_key = validate_environment()
            
            # Get tickers
            ticker_list = []
            if tickers:
                ticker_list = [t.strip().upper() for t in tickers.split(',') if t.strip()]
            else:
                ticker_list = get_followed_stock_symbols(user_id, db)
                if not ticker_list:
                    ticker_list = ["AAPL", "MSFT"]
                else:
                    ticker_list = ticker_list[:5]
            
            # Send initial event
            yield f"data: {json.dumps({'type': 'init', 'tickers': ticker_list, 'total': len(ticker_list)})}\n\n"
            
            # Initialize LLM
            llm = CrewCompatibleGemini(
                model="gemini-2.0-flash", 
                temperature=0.1,  # Lower for faster responses
                google_api_key=google_api_key,
                max_tokens=400  # Optimized for speed
            )
            
            # Initialize tools
            tools = []
            if serper_api_key:
                tools.append(SerperSearchTool())
            
            # Progress tracking
            progress_data = {ticker: 0.0 for ticker in ticker_list}
            
            def progress_callback(ticker: str, step: AnalysisStep, percentage: float):
                progress_data[ticker] = percentage
                # Send progress event
                asyncio.create_task(send_progress_event(ticker, step, percentage))
            
            async def send_progress_event(ticker: str, step: AnalysisStep, percentage: float):
                event_data = {
                    'type': 'progress',
                    'ticker': ticker,
                    'step': step.value,
                    'percentage': percentage,
                    'overall': sum(progress_data.values()) / len(progress_data)
                }
                yield f"data: {json.dumps(event_data)}\n\n"
            
            # Execute analysis for each ticker
            results = {}
            for ticker in ticker_list:
                yield f"data: {json.dumps({'type': 'start', 'ticker': ticker})}\n\n"
                
                result = await asyncio.get_event_loop().run_in_executor(
                    None,
                    execute_professional_analysis_with_progress,
                    ticker,
                    llm,
                    tools,
                    progress_callback,
                    60  # Reduced from 180 to 60 seconds
                )
                
                results[ticker] = result
                
                # Send completion event
                yield f"data: {json.dumps({'type': 'complete', 'ticker': ticker, 'result': result})}\n\n"
            
            # Send final summary
            successful = sum(1 for r in results.values() if r.get("status") == "success")
            summary = {
                'type': 'summary',
                'total_tickers': len(ticker_list),
                'successful': successful,
                'timestamp': datetime.now().isoformat()
            }
            yield f"data: {json.dumps(summary)}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )