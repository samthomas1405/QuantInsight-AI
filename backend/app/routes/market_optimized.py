"""
Optimized Market Data Routes with Multi-Provider Support
Uses intelligent caching and failover for cost-effective scaling
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth import get_current_user
from app.models.user import User
from app.services.market_data_service import market_data_service
from typing import List, Dict, Optional
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market", tags=["Market - Optimized"])

# Popular stocks to prefetch
POPULAR_STOCKS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "META", 
    "TSLA", "NVDA", "JPM", "V", "JNJ",
    "WMT", "PG", "UNH", "HD", "MA",
    "DIS", "BAC", "XOM", "PFE", "KO"
]

@router.on_event("startup")
async def startup_event():
    """Prefetch popular stocks on startup"""
    asyncio.create_task(prefetch_popular_stocks())

async def prefetch_popular_stocks():
    """Background task to periodically prefetch popular stocks"""
    while True:
        try:
            await market_data_service.prefetch_popular_stocks(POPULAR_STOCKS)
            logger.info("Prefetched popular stocks")
        except Exception as e:
            logger.error(f"Error prefetching stocks: {e}")
        
        # Wait 5 minutes before next prefetch
        await asyncio.sleep(300)

@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    """
    Get real-time quote for a single stock
    Automatically uses the best available data source
    """
    try:
        quote = await market_data_service.get_quote(symbol.upper())
        
        if not quote:
            raise HTTPException(status_code=404, detail=f"No data found for symbol {symbol}")
            
        return quote
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch quote")

@router.get("/quotes")
async def get_batch_quotes(symbols: str):
    """
    Get quotes for multiple stocks (comma-separated)
    Optimized for batch requests
    """
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
        
        if len(symbol_list) > 50:
            raise HTTPException(status_code=400, detail="Maximum 50 symbols per request")
            
        quotes = await market_data_service.get_batch_quotes(symbol_list)
        
        return quotes
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching batch quotes: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch quotes")

@router.get("/followed")
async def get_followed_stocks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get real-time data for user's followed stocks
    Uses intelligent caching to minimize API calls
    """
    try:
        # Get user's followed stocks
        followed_stocks = current_user.followed_stocks
        
        if not followed_stocks:
            return {}
            
        # Extract symbols
        symbols = [stock.symbol.upper() for stock in followed_stocks]
        
        # Get batch quotes
        quotes = await market_data_service.get_batch_quotes(symbols)
        
        return quotes
        
    except Exception as e:
        logger.error(f"Error fetching followed stocks: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market data")

@router.get("/market-summary")
async def get_market_summary():
    """
    Get major market indices
    Cached for 2 minutes
    """
    try:
        indices = ["SPY", "QQQ", "DIA", "IWM"]  # ETFs as proxy for indices
        
        quotes = await market_data_service.get_batch_quotes(indices)
        
        # Map to index names
        return {
            "S&P 500": quotes.get("SPY"),
            "NASDAQ": quotes.get("QQQ"),
            "Dow Jones": quotes.get("DIA"),
            "Russell 2000": quotes.get("IWM")
        }
        
    except Exception as e:
        logger.error(f"Error fetching market summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market summary")

@router.get("/cache-stats")
async def get_cache_stats():
    """
    Get cache statistics for monitoring
    """
    try:
        stats = market_data_service.get_cache_stats()
        return stats
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get cache stats")

@router.post("/warm-cache")
async def warm_cache(
    symbols: List[str],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Warm the cache with specific symbols
    Useful for pre-loading data before market open
    """
    try:
        # Limit to prevent abuse
        if len(symbols) > 100:
            raise HTTPException(status_code=400, detail="Maximum 100 symbols per request")
            
        # Add to background task
        background_tasks.add_task(
            market_data_service.prefetch_popular_stocks,
            symbols
        )
        
        return {"status": "Cache warming initiated", "symbols": len(symbols)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error warming cache: {e}")
        raise HTTPException(status_code=500, detail="Failed to warm cache")