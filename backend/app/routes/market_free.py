"""
Free Market Data Routes optimized for 100-200 users
Uses Yahoo Finance + Alpha Vantage with smart caching
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth import get_current_user
from app.models.user import User
from app.services.market_data_service_free import free_market_service
from typing import List, Dict
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market-free", tags=["Market - Free Tier"])

@router.on_event("startup")
async def startup_event():
    """Prefetch popular stocks on startup"""
    asyncio.create_task(periodic_prefetch())

async def periodic_prefetch():
    """Periodically prefetch popular stocks"""
    while True:
        try:
            await free_market_service.prefetch_popular_stocks()
            logger.info("Prefetched popular stocks")
        except Exception as e:
            logger.error(f"Prefetch error: {e}")
        
        # Wait 2 minutes between prefetches
        await asyncio.sleep(120)

@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    """Get real-time quote using free services"""
    try:
        quote = await free_market_service.get_quote(symbol.upper())
        
        if not quote:
            raise HTTPException(status_code=404, detail=f"No data found for {symbol}")
            
        return quote
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch quote")

@router.get("/quotes")
async def get_batch_quotes(symbols: str):
    """Get multiple quotes efficiently"""
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
        
        if len(symbol_list) > 20:
            raise HTTPException(status_code=400, detail="Maximum 20 symbols per request")
            
        quotes = await free_market_service.get_batch_quotes(symbol_list)
        
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
    """Get real-time data for user's followed stocks"""
    try:
        followed_stocks = current_user.followed_stocks
        
        if not followed_stocks:
            return {}
            
        symbols = [stock.symbol.upper() for stock in followed_stocks]
        
        # Limit to prevent abuse
        if len(symbols) > 30:
            symbols = symbols[:30]
            
        quotes = await free_market_service.get_batch_quotes(symbols)
        
        return quotes
        
    except Exception as e:
        logger.error(f"Error fetching followed stocks: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market data")

@router.get("/market-summary")
async def get_market_summary():
    """Get major market indices"""
    try:
        # Use ETFs as proxy for indices
        indices = {
            "S&P 500": "SPY",
            "NASDAQ": "QQQ",
            "Dow Jones": "DIA",
            "Russell 2000": "IWM"
        }
        
        symbols = list(indices.values())
        quotes = await free_market_service.get_batch_quotes(symbols)
        
        # Map back to index names
        result = {}
        for name, symbol in indices.items():
            if symbol in quotes:
                result[name] = quotes[symbol]
                
        return result
        
    except Exception as e:
        logger.error(f"Error fetching market summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market summary")

@router.get("/cache-stats")
async def get_cache_stats():
    """Get cache statistics for monitoring"""
    try:
        stats = free_market_service.get_cache_stats()
        
        # Add provider info
        stats['providers'] = {
            'primary': 'Yahoo Finance (free, no limits)',
            'backup': 'Alpha Vantage (500/day)' if free_market_service.alpha_vantage_key else 'Not configured',
            'cache_ttl': free_market_service.cache_ttl
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get cache stats")

@router.get("/test")
async def test_connection():
    """Test the connection and show configuration"""
    try:
        # Test with Apple stock
        quote = await free_market_service.get_quote("AAPL")
        
        return {
            "status": "success",
            "providers": {
                "yahoo_finance": "active",
                "alpha_vantage": "configured" if free_market_service.alpha_vantage_key else "not configured"
            },
            "cache_ttl": free_market_service.cache_ttl,
            "sample_quote": quote,
            "recommendation": "This setup can handle 100-200 users reliably with free services"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }