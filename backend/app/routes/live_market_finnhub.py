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
import random

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market-finnhub", tags=["Market - Finnhub"])

# Initialize Finnhub client
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
finnhub_client = None

if not FINNHUB_API_KEY:
    logger.error("FINNHUB_API_KEY not found in environment variables")
else:
    try:
        finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY)
        logger.info(f"Finnhub client initialized successfully with key: {FINNHUB_API_KEY[:8]}...")
    except Exception as e:
        logger.error(f"Failed to initialize Finnhub client: {e}")
        finnhub_client = None

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

def get_sector_name(profile: dict) -> str:
    """Map Finnhub industry to more common sector names"""
    if not profile:
        return "Stock"
    
    industry = profile.get('finnhubIndustry', '')
    symbol = profile.get('ticker', '')
    
    # Custom mappings for specific companies
    tech_companies = ['GOOGL', 'GOOG', 'META', 'MSFT', 'AAPL', 'AMZN', 'NFLX']
    if symbol in tech_companies or industry in ['Media', 'Internet Content & Information', 'Interactive Media & Services']:
        return "Technology"
    
    # General sector mappings
    sector_map = {
        'Pharmaceuticals': 'Healthcare',
        'Biotechnology': 'Healthcare',
        'Banks': 'Financial Services',
        'Capital Markets': 'Financial Services',
        'Insurance': 'Financial Services',
        'Oil & Gas': 'Energy',
        'Automobiles': 'Automotive',
        'Airlines': 'Transportation',
        'Retail': 'Consumer Discretionary',
        'Food Products': 'Consumer Staples',
        'Beverages': 'Consumer Staples',
        'Semiconductors': 'Technology',
        'Software': 'Technology',
        'Hardware': 'Technology',
        'Telecommunications': 'Communication Services',
        'Real Estate': 'Real Estate',
        'Utilities': 'Utilities',
        'Metals & Mining': 'Materials',
        'Chemicals': 'Materials',
    }
    
    # Check if industry contains any key from sector_map
    for key, value in sector_map.items():
        if key.lower() in industry.lower():
            return value
    
    # Return the original industry if no mapping found
    return industry if industry else 'Stock'

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
        
        # Log quote data for debugging volume issue
        logger.info(f"Finnhub quote data for {symbol}: {quote}")
        
        # Get company profile for name (cached separately)
        profile = get_cached_or_fetch(
            f"profile_{symbol}", 
            lambda s: finnhub_client.company_profile2(symbol=s), 
            symbol.upper()
        )
        
        # Get volume - cache separately as it's expensive
        volume = 0
        volume_cache_key = f"volume_{symbol}_{datetime.now().strftime('%Y%m%d')}"
        
        # Try to get cached volume first
        cached_volume = get_cached_or_fetch(
            volume_cache_key,
            lambda: None,  # Don't fetch yet
        )
        
        if cached_volume is not None:
            volume = cached_volume
        else:
            # Fetch fresh volume data
            try:
                # Try multiple approaches to get volume
                volume_found = False
                
                # First try: Get today's intraday data (1-minute candles for last 2 hours)
                now = int(time.time())
                two_hours_ago = now - 7200
                
                try:
                    intraday_candles = finnhub_client.stock_candles(symbol.upper(), '1', two_hours_ago, now)
                    if intraday_candles and intraday_candles.get('s') == 'ok' and intraday_candles.get('v'):
                        # Sum up the volumes from intraday data
                        intraday_volume = sum(intraday_candles['v'])
                        if intraday_volume > 0:
                            volume = intraday_volume
                            volume_found = True
                            logger.info(f"Got intraday volume for {symbol}: {volume}")
                except Exception as e:
                    logger.debug(f"Intraday volume fetch failed for {symbol}: {e}")
                
                # Second try: Daily candles if intraday failed
                if not volume_found:
                    today_start = now - 86400  # Last 24 hours
                    candles = finnhub_client.stock_candles(symbol.upper(), 'D', today_start, now)
                    
                    if candles and candles.get('s') == 'ok' and candles.get('v'):
                        # Get today's volume
                        volume = candles['v'][-1] if candles['v'] else 0
                        if volume > 0:
                            volume_found = True
                            logger.info(f"Got daily volume for {symbol}: {volume}")
                
                # Third try: Get from quote data if available
                if not volume_found and 'v' in quote:
                    volume = quote.get('v', 0)
                    if volume > 0:
                        volume_found = True
                        logger.info(f"Got volume from quote for {symbol}: {volume}")
                
                # Cache the volume if found
                if volume_found and volume > 0:
                    if redis_client:
                        redis_client.setex(volume_cache_key, 300, str(volume))
                    elif 'memory_cache' in globals():
                        with cache_lock:
                            memory_cache[volume_cache_key] = (volume, time.time())
                else:
                    # No volume data available
                    volume = 0
                    logger.warning(f"No volume data available for {symbol}")
                            
            except Exception as e:
                logger.warning(f"Could not get volume for {symbol}: {e}")
                volume = 0  # Show 0 when no data is available
        
        return {
            "symbol": symbol.upper(),
            "price": round(current_price, 2),
            "change": round(change, 2),
            "percent_change": round(percent_change, 2),
            "volume": int(volume),  # Volume from candles
            "high": round(quote['h'], 2),  # High price of the day
            "low": round(quote['l'], 2),   # Low price of the day
            "open": round(quote['o'], 2),  # Open price
            "previous_close": round(previous_close, 2),
            "last_updated": datetime.now().isoformat(),
            "market_cap": profile.get('marketCapitalization', 0) * 1000000 if profile else 0,
            "name": profile.get('name', symbol) if profile else symbol,
            "sector": get_sector_name(profile) if profile else 'Stock',
            "provider": "finnhub"
        }
        
    except Exception as e:
        logger.error(f"Error fetching Finnhub data for {symbol}: {str(e)}")
        return None

def get_finnhub_candles(symbol: str, resolution: str = "1", from_time: int = None, to_time: int = None) -> List[Dict]:
    """Get historical candle data from Finnhub"""
    try:
        if not FINNHUB_API_KEY:
            logger.error("FINNHUB_API_KEY is not set")
            return []
            
        if not finnhub_client:
            logger.error("Finnhub client is not initialized")
            return []
            
        # Default to last day if no time range specified
        if not to_time:
            to_time = int(time.time())
        if not from_time:
            from_time = to_time - 86400  # 24 hours ago
            
        logger.info(f"Fetching candles for {symbol} with resolution={resolution}, from={from_time}, to={to_time}")
        
        # Get candle data
        candles = finnhub_client.stock_candles(
            symbol.upper(), 
            resolution, 
            from_time, 
            to_time
        )
        
        logger.info(f"Finnhub response for {symbol}: {candles}")
        
        if not candles or candles.get('s') != 'ok' or not candles.get('t'):
            logger.warning(f"No candle data for {symbol}. Response: {candles}")
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
        
        logger.info(f"Returning {len(formatted_data)} candles for {symbol}")
        return formatted_data
        
    except Exception as e:
        logger.error(f"Error fetching Finnhub candles for {symbol}: {str(e)}", exc_info=True)
        return []

@router.get("/test-intraday")
def test_intraday_data():
    """Test intraday data availability"""
    try:
        if not FINNHUB_API_KEY or not finnhub_client:
            return {"error": "Finnhub not configured"}
        
        # Test different resolutions for today
        now = int(time.time())
        today_start = now - (12 * 3600)  # 12 hours ago
        
        results = {}
        resolutions = ["1", "5", "15", "30", "60"]
        
        for res in resolutions:
            try:
                candles = finnhub_client.stock_candles("AAPL", res, today_start, now)
                results[f"{res}_min"] = {
                    "success": candles.get('s') == 'ok',
                    "count": len(candles.get('t', [])) if candles else 0,
                    "status": candles.get('s') if candles else None
                }
            except Exception as e:
                results[f"{res}_min"] = {"error": str(e)}
        
        return {
            "test_time": datetime.now().isoformat(),
            "resolutions_tested": results,
            "recommendation": "Use the resolution that returns data successfully"
        }
        
    except Exception as e:
        return {"error": str(e)}

@router.get("/test")
def test_connection():
    """Test the Finnhub connection"""
    try:
        if not FINNHUB_API_KEY:
            return {
                "status": "error",
                "message": "Finnhub API key not configured",
                "api_key_exists": False,
                "instruction": "Please set FINNHUB_API_KEY in your .env file"
            }
            
        # Test with Apple stock quote
        quote = finnhub_client.quote("AAPL")
        
        # Test historical data
        now = int(time.time())
        from_time = now - 86400  # 24 hours ago
        candles = None
        try:
            candles = finnhub_client.stock_candles("AAPL", "D", from_time, now)
        except Exception as candle_error:
            logger.error(f"Candle test error: {candle_error}")
        
        return {
            "status": "success" if quote and quote.get('c', 0) > 0 else "partial",
            "message": "Finnhub connection test results",
            "api_key_exists": True,
            "quote_test": {
                "success": bool(quote and quote.get('c', 0) > 0),
                "data": quote if quote else None
            },
            "candle_test": {
                "success": bool(candles and candles.get('s') == 'ok'),
                "data": {
                    "status": candles.get('s') if candles else None,
                    "count": len(candles.get('t', [])) if candles and candles.get('t') else 0
                } if candles else None
            },
            "rate_limit": "60 requests per minute",
            "timestamp": datetime.now().isoformat()
        }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Finnhub connection failed: {str(e)}",
            "api_key_exists": bool(FINNHUB_API_KEY)
        }

@router.get("/test-volume/{symbol}")
def test_volume(symbol: str):
    """Test volume fetching for a specific symbol"""
    try:
        results = {}
        
        # Test 1: Quote data
        quote = finnhub_client.quote(symbol.upper())
        results["quote"] = {"data": quote, "has_volume": 'v' in quote if quote else False}
        
        # Test 2: Intraday candles
        now = int(time.time())
        two_hours_ago = now - 7200
        try:
            intraday = finnhub_client.stock_candles(symbol.upper(), '1', two_hours_ago, now)
            if intraday and intraday.get('s') == 'ok' and intraday.get('v'):
                volume_sum = sum(intraday['v'])
                results["intraday"] = {
                    "success": True,
                    "volume_sum": volume_sum,
                    "candle_count": len(intraday['v']),
                    "sample_volumes": intraday['v'][:5] if intraday['v'] else []
                }
            else:
                results["intraday"] = {"success": False, "data": intraday}
        except Exception as e:
            results["intraday"] = {"success": False, "error": str(e)}
        
        # Test 3: Daily candles
        yesterday = now - 86400
        try:
            daily = finnhub_client.stock_candles(symbol.upper(), 'D', yesterday, now)
            if daily and daily.get('s') == 'ok' and daily.get('v'):
                results["daily"] = {
                    "success": True,
                    "volumes": daily['v'],
                    "timestamps": [datetime.fromtimestamp(t).strftime('%Y-%m-%d') for t in daily['t']] if 't' in daily else []
                }
            else:
                results["daily"] = {"success": False, "data": daily}
        except Exception as e:
            results["daily"] = {"success": False, "error": str(e)}
        
        return results
        
    except Exception as e:
        return {"error": str(e)}

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
        
        # For intraday (1d), get from market open (9:30 AM ET) to now
        if period == "1d":
            # Get today's date at 9:30 AM ET (14:30 UTC)
            today = datetime.now()
            market_open = today.replace(hour=14, minute=30, second=0, microsecond=0)  # 9:30 AM ET in UTC
            
            # If market hasn't opened yet, use yesterday's data
            if datetime.now().timestamp() < market_open.timestamp():
                market_open = market_open - timedelta(days=1)
            
            from_time = int(market_open.timestamp())
            # For intraday, use minute resolution
            resolution = resolution_map.get(interval, "1")
            
            logger.info(f"Fetching intraday data from {market_open} to now")
        else:
            # For longer periods, use daily data
            period_map = {
                "5d": now - 432000,     # 5 days
                "1mo": now - 2592000,   # 30 days
                "3mo": now - 7776000,   # 90 days
                "6mo": now - 15552000,  # 180 days
                "1y": now - 31536000,   # 365 days
                "2y": now - 63072000,   # 730 days
                "5y": now - 157680000   # 5 years
            }
            from_time = period_map.get(period, now - 86400)
            # Use daily resolution for longer periods
            resolution = "D"
        
        # Get candle data
        candles = get_finnhub_candles(symbol, resolution, from_time, now)
        
        if not candles:
            # Check if we should try with a different resolution
            if period == "1d" and resolution in ["1", "5", "15"]:
                # Try 1-hour candles for intraday
                logger.info(f"Trying 60-minute candles for intraday data")
                candles = get_finnhub_candles(symbol, "60", from_time, now)
            
            if not candles:
                # Generate synthetic data for demonstration
                logger.info(f"Generating synthetic data for {symbol} due to API limitations")
                
                # Get current quote for base price
                quote_data = get_finnhub_quote(symbol)
                if quote_data:
                    base_price = quote_data['price']
                    open_price = quote_data.get('open', base_price)
                else:
                    # Default prices for common symbols
                    default_prices = {
                        "AAPL": 230.0,
                        "GOOGL": 140.0,
                        "MSFT": 420.0,
                        "AMZN": 175.0,
                        "TSLA": 250.0
                    }
                    base_price = default_prices.get(symbol.upper(), 100.0)
                    open_price = base_price
                
                candles = []
                
                if period == "1d":
                    # Generate intraday data (minute by minute from 9:30 AM to now)
                    minutes_since_open = int((now - from_time) / 60)
                    current_price = open_price
                    
                    for i in range(0, minutes_since_open, 5):  # 5-minute intervals
                        # Simulate intraday volatility
                        change = (random.random() - 0.5) * 0.001 * current_price  # ±0.1% per 5 minutes
                        current_price += change
                        high = current_price + random.random() * 0.0005 * current_price
                        low = current_price - random.random() * 0.0005 * current_price
                        volume = random.randint(100000, 500000)
                        
                        candles.append({
                            "timestamp": from_time + (i * 60),
                            "open": round(current_price - change/2, 2),
                            "high": round(high, 2),
                            "low": round(low, 2),
                            "price": round(current_price, 2),
                            "volume": volume
                        })
                else:
                    # Generate daily data for longer periods
                    current_time = now
                    days_to_generate = {
                        "5d": 5,
                        "1mo": 30,
                        "3mo": 90,
                        "6mo": 180,
                        "1y": 365
                    }.get(period, 30)
                    
                    for i in range(days_to_generate):
                        daily_change = (random.random() - 0.5) * 0.02 * base_price
                        open_price = base_price + daily_change
                        close_price = open_price + (random.random() - 0.5) * 0.01 * base_price
                        high_price = max(open_price, close_price) + random.random() * 0.005 * base_price
                        low_price = min(open_price, close_price) - random.random() * 0.005 * base_price
                        volume = random.randint(10000000, 50000000)
                        
                        candles.append({
                            "timestamp": current_time - (i * 86400),
                            "open": round(open_price, 2),
                            "high": round(high_price, 2),
                            "low": round(low_price, 2),
                            "price": round(close_price, 2),
                            "volume": volume
                        })
                        
                        base_price = close_price
                    
                    candles.reverse()
                
                # Add a note about synthetic data
                if candles:
                    candles[0]["_note"] = "Synthetic data - API limitation"
        
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