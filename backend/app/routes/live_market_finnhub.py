"""
Finnhub Market Data Routes - Reliable and Free
60 requests per minute, official API support
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth import get_current_user
from app.models.user import User
import os
import finnhub
import requests
from typing import List, Dict, Optional
import time
from datetime import datetime, timedelta
import logging
from functools import lru_cache
import threading
import redis
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market-finnhub", tags=["Market - Finnhub"])

# Initialize Finnhub client
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
if not FINNHUB_API_KEY:
    logger.error("FINNHUB_API_KEY not found in environment variables")
else:
    finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY)
    logger.info("Finnhub client initialized successfully")

# Redis configuration
redis_client = None
try:
    redis_client = redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', 6379)),
        decode_responses=True
    )
    redis_client.ping()
    logger.info("Redis connection established for Finnhub")
except Exception as e:
    logger.warning(f"Redis not available, using in-memory cache: {e}")
    # Fallback to in-memory cache
    memory_cache = {}
    cache_lock = threading.Lock()

CACHE_TTL = 60  # Cache for 60 seconds

def get_cached_or_fetch(key: str, fetch_func, *args, **kwargs):
    """Get data from cache or fetch if expired - Redis with fallback"""
    try:
        if redis_client:
            # Try Redis first
            cached_data = redis_client.get(key)
            if cached_data:
                return json.loads(cached_data)
            
            # Fetch new data
            data = fetch_func(*args, **kwargs)
            if data is not None:
                # Store in Redis with TTL
                redis_client.setex(key, CACHE_TTL, json.dumps(data))
            return data
        else:
            # Fallback to in-memory cache
            with cache_lock:
                now = time.time()
                if key in memory_cache:
                    data, timestamp = memory_cache[key]
                    if now - timestamp < CACHE_TTL:
                        return data
                
                # Fetch new data
                data = fetch_func(*args, **kwargs)
                if data is not None:
                    memory_cache[key] = (data, now)
                return data
                
    except Exception as e:
        logger.error(f"Cache error for {key}: {str(e)}")
        # Try to fetch fresh data on cache error
        try:
            return fetch_func(*args, **kwargs)
        except:
            return None

def get_finnhub_quote(symbol: str) -> Optional[Dict]:
    """Get quote from Finnhub"""
    try:
        if not FINNHUB_API_KEY:
            return None
            
        # Get quote data
        quote = finnhub_client.quote(symbol.upper())
        
        if not quote or quote.get('c') == 0:
            logger.warning(f"No data returned for {symbol}")
            return None
        
        # Calculate change and percent change
        current_price = quote['c']  # Current price
        previous_close = quote['pc']  # Previous close
        change = current_price - previous_close
        percent_change = (change / previous_close * 100) if previous_close > 0 else 0
        
        # Get company profile for name (cached separately)
        profile = get_cached_or_fetch(
            f"profile_{symbol}", 
            lambda s: finnhub_client.company_profile2(symbol=s), 
            symbol.upper()
        )
        
        return {
            "symbol": symbol.upper(),
            "price": round(current_price, 2),
            "change": round(change, 2),
            "percent_change": round(percent_change, 2),
            "volume": quote.get('v', 0),  # Volume (if available)
            "high": round(quote['h'], 2),  # High price of the day
            "low": round(quote['l'], 2),   # Low price of the day
            "open": round(quote['o'], 2),  # Open price
            "previous_close": round(previous_close, 2),
            "last_updated": datetime.now().isoformat(),
            "market_cap": profile.get('marketCapitalization', 0) * 1000000 if profile else 0,
            "name": profile.get('name', symbol) if profile else symbol,
            "provider": "finnhub"
        }
        
    except Exception as e:
        logger.error(f"Error fetching Finnhub data for {symbol}: {str(e)}")
        return None

def get_finnhub_candles(symbol: str, resolution: str = "1", from_time: int = None, to_time: int = None) -> List[Dict]:
    """Get historical candle data from Finnhub"""
    try:
        if not FINNHUB_API_KEY:
            return []
            
        # Default to last day if no time range specified
        if not to_time:
            to_time = int(time.time())
        if not from_time:
            from_time = to_time - 86400  # 24 hours ago
            
        # Get candle data
        candles = finnhub_client.stock_candles(
            symbol.upper(), 
            resolution, 
            from_time, 
            to_time
        )
        
        if candles['s'] != 'ok' or not candles.get('t'):
            logger.warning(f"No candle data for {symbol}")
            return []
        
        # Format candle data
        formatted_data = []
        for i in range(len(candles['t'])):
            formatted_data.append({
                "timestamp": candles['t'][i],
                "price": round(candles['c'][i], 2),  # Close price
                "high": round(candles['h'][i], 2),
                "low": round(candles['l'][i], 2),
                "open": round(candles['o'][i], 2),
                "volume": candles['v'][i]
            })
        
        return formatted_data
        
    except Exception as e:
        logger.error(f"Error fetching Finnhub candles for {symbol}: {str(e)}")
        return []

@router.get("/test")
def test_connection():
    """Test the Finnhub connection"""
    try:
        if not FINNHUB_API_KEY:
            return {
                "status": "error",
                "message": "Finnhub API key not configured"
            }
            
        # Test with Apple stock
        quote = finnhub_client.quote("AAPL")
        
        if quote and quote.get('c', 0) > 0:
            return {
                "status": "success",
                "message": "Finnhub connection successful",
                "sample_data": {
                    "symbol": "AAPL",
                    "price": quote['c'],
                    "timestamp": datetime.now().isoformat()
                },
                "rate_limit": "60 requests per minute"
            }
        else:
            return {
                "status": "error",
                "message": "Finnhub returned no data"
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Finnhub connection failed: {str(e)}"
        }

@router.get("/followed")
def get_followed_stocks_live(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Get live market data for user's followed stocks using Finnhub"""
    try:
        # Get user's followed stocks
        followed_stocks = current_user.followed_stocks
        
        if not followed_stocks:
            return {}
        
        result = {}
        for stock in followed_stocks:
            symbol = stock.symbol.upper()
            
            # Use cache to avoid hitting rate limits
            stock_data = get_cached_or_fetch(
                f"stock_{symbol}", 
                get_finnhub_quote, 
                symbol
            )
            
            if stock_data:
                result[symbol] = stock_data
            else:
                logger.warning(f"No data available for {symbol}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in get_followed_stocks_live: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")

@router.get("/quote/{symbol}")
def get_single_quote(symbol: str):
    """Get detailed quote for a single stock"""
    try:
        stock_data = get_cached_or_fetch(
            f"stock_{symbol}", 
            get_finnhub_quote, 
            symbol
        )
        
        if not stock_data:
            raise HTTPException(status_code=404, detail=f"No data found for symbol {symbol}")
        
        # Add some additional data if available
        try:
            # Get basic financials (cached for longer)
            financials = get_cached_or_fetch(
                f"financials_{symbol}",
                lambda s: finnhub_client.company_basic_financials(s, 'all'),
                symbol.upper()
            )
            
            if financials and 'metric' in financials:
                stock_data['52_week_high'] = financials['metric'].get('52WeekHigh', 0)
                stock_data['52_week_low'] = financials['metric'].get('52WeekLow', 0)
                stock_data['pe_ratio'] = financials['metric'].get('peBasicExclExtraTTM', 0)
        except:
            pass
        
        return stock_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch quote: {str(e)}")

@router.get("/history/{symbol}")
def get_stock_history(
    symbol: str, 
    period: str = "1d", 
    interval: str = "1m"
):
    """Get historical data for a stock using Finnhub"""
    try:
        # Map intervals to Finnhub resolutions
        resolution_map = {
            "1m": "1",      # 1 minute
            "5m": "5",      # 5 minutes
            "15m": "15",    # 15 minutes
            "30m": "30",    # 30 minutes
            "1h": "60",     # 60 minutes
            "1d": "D",      # Day
            "1wk": "W",     # Week
            "1mo": "M"      # Month
        }
        
        # Map periods to time ranges
        now = int(time.time())
        period_map = {
            "1d": now - 86400,      # 1 day
            "5d": now - 432000,     # 5 days
            "1mo": now - 2592000,   # 30 days
            "3mo": now - 7776000,   # 90 days
            "6mo": now - 15552000,  # 180 days
            "1y": now - 31536000,   # 365 days
            "2y": now - 63072000,   # 730 days
            "5y": now - 157680000   # 5 years
        }
        
        resolution = resolution_map.get(interval, "1")
        from_time = period_map.get(period, now - 86400)
        
        # Get candle data
        candles = get_finnhub_candles(symbol, resolution, from_time, now)
        
        if not candles:
            # Fallback to daily data if intraday not available
            if resolution in ["1", "5", "15", "30", "60"]:
                logger.info(f"Intraday data not available for {symbol}, falling back to daily")
                candles = get_finnhub_candles(symbol, "D", from_time, now)
        
        if not candles:
            raise HTTPException(status_code=404, detail=f"No historical data found for {symbol}")
        
        return candles
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching history for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical data: {str(e)}")

@router.get("/market-summary")
def get_market_summary():
    """Get summary of major market indices"""
    try:
        # Major indices ETFs
        indices = {
            "S&P 500": "SPY",
            "NASDAQ": "QQQ", 
            "Dow Jones": "DIA",
            "Russell 2000": "IWM"
        }
        
        result = {}
        for name, symbol in indices.items():
            data = get_cached_or_fetch(
                f"stock_{symbol}", 
                get_finnhub_quote, 
                symbol
            )
            if data:
                result[name] = data
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching market summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch market summary: {str(e)}")

@router.get("/search/{query}")
def search_symbols(query: str):
    """Search for symbols using Finnhub"""
    try:
        if not FINNHUB_API_KEY:
            raise HTTPException(status_code=500, detail="Finnhub API key not configured")
            
        # Search for symbols
        results = finnhub_client.symbol_lookup(query)
        
        # Format results
        formatted_results = []
        for result in results.get('result', [])[:10]:  # Limit to 10 results
            formatted_results.append({
                "symbol": result['symbol'],
                "description": result['description'],
                "type": result.get('type', 'Stock')
            })
        
        return formatted_results
        
    except Exception as e:
        logger.error(f"Error searching symbols: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search symbols: {str(e)}")

@router.get("/cache-stats")
def get_cache_stats():
    """Get cache statistics to monitor efficiency"""
    try:
        if redis_client:
            # Redis stats
            info = redis_client.info()
            dbsize = redis_client.dbsize()
            
            # Count Finnhub-specific keys
            finnhub_keys = 0
            for key in redis_client.scan_iter("stock_*"):
                finnhub_keys += 1
            for key in redis_client.scan_iter("profile_*"):
                finnhub_keys += 1
            for key in redis_client.scan_iter("financials_*"):
                finnhub_keys += 1
                
            return {
                "cache_type": "Redis",
                "status": "Connected",
                "total_keys": dbsize,
                "finnhub_keys": finnhub_keys,
                "memory_used": info.get('used_memory_human', 'N/A'),
                "hit_rate": round(info.get('keyspace_hits', 0) / max(info.get('keyspace_hits', 0) + info.get('keyspace_misses', 1), 1) * 100, 2),
                "uptime": info.get('uptime_in_seconds', 0),
                "cache_ttl": CACHE_TTL,
                "efficiency_tip": "Redis cache is shared across all workers, reducing API calls significantly"
            }
        else:
            # In-memory stats
            return {
                "cache_type": "In-Memory",
                "status": "Active (Redis not available)",
                "cached_items": len(memory_cache) if 'memory_cache' in globals() else 0,
                "cache_ttl": CACHE_TTL,
                "efficiency_tip": "Consider starting Redis for better caching across multiple workers"
            }
            
    except Exception as e:
        logger.error(f"Error getting cache stats: {str(e)}")
        return {
            "cache_type": "Unknown",
            "status": "Error",
            "error": str(e)
        }