from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from datetime import datetime
import json
import logging
import concurrent.futures
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.auth import get_current_user
from app.models.user import User
from app.models.analysis_history import AnalysisHistory
from app.dependencies import get_db
from app.routes.news import (
    validate_environment, 
    CrewCompatibleGemini,
    execute_stock_prediction
)
from crewai import Agent, Task, Crew, Process

router = APIRouter(prefix="/comparison", tags=["Stock Comparison"])
logger = logging.getLogger(__name__)


class CompareStocksRequest(BaseModel):
    tickers: List[str]


@router.post("/compare")
def compare_stocks(request: CompareStocksRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Compare multiple stocks using multi-agent analysis and recommend the best one to buy"""
    try:
        logger.info(f"=== Starting STOCK COMPARISON for user {current_user.id} ===")
        logger.info(f"Comparing stocks: {request.tickers}")
        
        if len(request.tickers) < 2:
            raise HTTPException(status_code=400, detail="At least 2 stocks required for comparison")
        
        # Validate environment
        google_api_key, serper_api_key = validate_environment()
        
        # Initialize Gemini LLM
        llm = CrewCompatibleGemini(
            model="gemini-2.0-flash",
            temperature=0.1,
            google_api_key=google_api_key,
            max_tokens=800
        )
        
        # First, analyze each stock individually using existing multi-agent system
        all_analyses = {}
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(request.tickers)) as executor:
            future_to_ticker = {
                executor.submit(
                    execute_stock_prediction,
                    ticker,
                    llm,
                    [],  # tools - empty list for now
                    400  # timeout_seconds
                ): ticker for ticker in request.tickers
            }
            
            for future in concurrent.futures.as_completed(future_to_ticker):
                ticker = future_to_ticker[future]
                try:
                    result = future.result()
                    # Extract the prediction from the result structure
                    if result.get("status") == "success" and result.get("prediction"):
                        all_analyses[ticker] = result["prediction"]
                    else:
                        all_analyses[ticker] = result.get("prediction", {"error": "Analysis failed"})
                    logger.info(f"✓ Completed analysis for {ticker}")
                except Exception as e:
                    logger.error(f"Error analyzing {ticker}: {e}")
                    all_analyses[ticker] = {"error": str(e)}
        
        # Create comparison agent
        comparison_agent = Agent(
            role="Stock Comparison Specialist",
            goal="Compare multiple stocks and recommend the best investment opportunity",
            backstory="""You are an expert investment advisor specializing in comparative stock analysis.
            You excel at comparing multiple investment opportunities and identifying the best choice based on:
            - Growth potential and momentum
            - Financial health and fundamentals
            - Risk/reward ratio
            - Market sentiment and timing
            - Technical indicators
            You provide clear, decisive recommendations backed by solid reasoning.""",
            verbose=True,
            allow_delegation=False,
            llm=llm
        )
        
        # Prepare comparison data
        comparison_data = "\n\n".join([
            f"=== {ticker} Analysis ===\n{json.dumps(analysis, indent=2)}"
            for ticker, analysis in all_analyses.items()
            if "error" not in analysis
        ])
        
        # Create comparison task
        comparison_task = Task(
            description=f"""Compare the following stocks and recommend which ONE is the best buy:
            
            Stocks to compare: {', '.join(request.tickers)}
            
            Analysis data for each stock:
            {comparison_data}
            
            Provide:
            1. A ranking of all stocks from best to worst investment
            2. Clear recommendation of which stock to buy
            3. Key reasons for your recommendation
            4. Comparative analysis highlighting why the recommended stock is better
            5. Risk factors to consider
            
            Format your response as:
            RECOMMENDATION: [Stock Symbol]
            RANKING: [1. SYMBOL - reason, 2. SYMBOL - reason, etc.]
            KEY REASONS: [Bullet points]
            COMPARATIVE ADVANTAGE: [Why this stock beats others]
            RISKS: [Key risks to watch]
            """,
            expected_output="A clear stock recommendation with ranking and comparative analysis",
            agent=comparison_agent
        )
        
        # Execute comparison
        comparison_crew = Crew(
            agents=[comparison_agent],
            tasks=[comparison_task],
            process=Process.sequential
        )
        
        comparison_result = comparison_crew.kickoff()
        
        # Parse the comparison result
        comparison_text = str(comparison_result)
        
        # Extract recommended stock
        recommended_stock = None
        if "RECOMMENDATION:" in comparison_text:
            rec_line = comparison_text.split("RECOMMENDATION:")[1].split("\n")[0].strip()
            recommended_stock = rec_line.upper()
        
        # Create response
        response = {
            "analyses": all_analyses,
            "comparison_summary": comparison_text,
            "recommended_stock": recommended_stock,
            "ranking": extract_ranking(comparison_text),
            "timestamp": datetime.now().isoformat()
        }
        
        # Save to analysis history
        try:
            history_entry = AnalysisHistory(
                user_id=current_user.id,
                tickers=",".join(request.tickers),
                analysis_type="comparison",
                results=response
            )
            db.add(history_entry)
            db.commit()
            logger.info(f"✓ Saved comparison analysis to history")
        except Exception as e:
            logger.error(f"Error saving to history: {e}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error in compare_stocks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def extract_ranking(comparison_text: str) -> List[Dict[str, str]]:
    """Extract ranking from comparison text"""
    ranking = []
    if "RANKING:" in comparison_text:
        ranking_section = comparison_text.split("RANKING:")[1].split("\n\n")[0]
        lines = ranking_section.strip().split("\n")
        for line in lines:
            if ". " in line:
                parts = line.split(". ", 1)
                if len(parts) == 2:
                    rank_info = parts[1].split(" - ", 1)
                    if len(rank_info) >= 1:
                        ranking.append({
                            "rank": len(ranking) + 1,
                            "symbol": rank_info[0].strip(),
                            "reason": rank_info[1].strip() if len(rank_info) > 1 else ""
                        })
    return ranking