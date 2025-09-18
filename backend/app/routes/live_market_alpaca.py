"""
Alpaca Markets Data Routes - Free real-time and historical data
Supports intraday data, quotes, and historical bars
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth import get_current_user
from app.models.user import User
import os
import requests
from typing import List, Dict, Optional
import time
from datetime import datetime, timedelta
import pytz
import logging
import threading
import redis
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market-alpaca", tags=["Market - Alpaca"])

# Initialize Alpaca client
ALPACA_API_KEY = os.getenv("ALPACA_API_KEY")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY")
ALPACA_BASE_URL = "https://data.alpaca.markets"

if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
    logger.error("ALPACA_API_KEY or ALPACA_SECRET_KEY not found in environment variables")
else:
    logger.info(f"Alpaca client initialized with key: {ALPACA_API_KEY[:8]}...")

# Redis configuration (reuse from other modules)
redis_client = None
try:
    redis_client = redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', 6379)),
        decode_responses=True
    )
    redis_client.ping()
    logger.info("Redis connection established for Alpaca")
except Exception as e:
    logger.warning(f"Redis not available, using in-memory cache: {e}")
    memory_cache = {}
    cache_lock = threading.Lock()

CACHE_TTL = 60  # Cache for 60 seconds

def get_cached_or_fetch(key: str, fetch_func, *args, **kwargs):
    """Get data from cache or fetch if expired"""
    try:
        if redis_client:
            cached_data = redis_client.get(key)
            if cached_data:
                return json.loads(cached_data)
            
            data = fetch_func(*args, **kwargs)
            if data is not None:
                redis_client.setex(key, CACHE_TTL, json.dumps(data))
            return data
        else:
            with cache_lock:
                now = time.time()
                if key in memory_cache:
                    data, timestamp = memory_cache[key]
                    if now - timestamp < CACHE_TTL:
                        return data
                
                data = fetch_func(*args, **kwargs)
                if data is not None:
                    memory_cache[key] = (data, now)
                return data
                
    except Exception as e:
        logger.error(f"Cache error for {key}: {str(e)}")
        try:
            return fetch_func(*args, **kwargs)
        except:
            return None

def make_alpaca_request(endpoint: str, params: dict = None) -> dict:
    """Make authenticated request to Alpaca API"""
    if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
        raise Exception("Alpaca API credentials not configured")
    
    headers = {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
        "Content-Type": "application/json"
    }
    
    url = f"{ALPACA_BASE_URL}{endpoint}"
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        # Log the request details for debugging
        logger.info(f"Alpaca API request: {url}")
        logger.info(f"Params: {params}")
        
        if response.status_code != 200:
            logger.error(f"Alpaca API error: {response.status_code} - {response.text}")
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Alpaca API request failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response content: {e.response.text}")
        raise Exception(f"Alpaca API request failed: {e}")

def get_alpaca_quote(symbol: str) -> Optional[Dict]:
    """Get latest quote from Alpaca"""
    try:
        endpoint = f"/v2/stocks/{symbol.upper()}/quotes/latest"
        data = make_alpaca_request(endpoint)
        
        if not data or 'quote' not in data:
            return None
        
        quote = data['quote']
        
        # Calculate basic metrics
        bid = quote.get('bid_price', 0)
        ask = quote.get('ask_price', 0)
        current_price = (bid + ask) / 2 if bid and ask else bid or ask
        
        return {
            "symbol": symbol.upper(),
            "price": round(current_price, 2),
            "bid": round(bid, 2),
            "ask": round(ask, 2),
            "bid_size": quote.get('bid_size', 0),
            "ask_size": quote.get('ask_size', 0),
            "last_updated": quote.get('timestamp', datetime.now().isoformat()),
            "provider": "alpaca"
        }
        
    except Exception as e:
        logger.error(f"Error fetching Alpaca quote for {symbol}: {str(e)}")
        return None

def get_alpaca_bars(symbol: str, timeframe: str = "1Min", start_time: str = None, end_time: str = None) -> List[Dict]:
    """Get historical bars from Alpaca"""
    try:
        endpoint = f"/v2/stocks/{symbol.upper()}/bars"
        
        params = {
            "timeframe": timeframe,
            "limit": 1000,
            "adjustment": "raw",
            "feed": "iex",  # Use IEX feed for free tier
            "asof": None,
            "page_token": None
        }
        
        if start_time:
            params["start"] = start_time
        if end_time:
            params["end"] = end_time
        
        logger.info(f"Fetching Alpaca bars for {symbol} with params: {params}")
        
        data = make_alpaca_request(endpoint, params)
        
        if not data or 'bars' not in data:
            logger.warning(f"No bar data for {symbol}")
            return []
        
        bars = data.get('bars', [])
        
        if not bars:
            logger.warning(f"No bars returned in response for {symbol}")
            return []
        
        formatted_data = []
        
        for bar in bars:
            try:
                formatted_data.append({
                    "timestamp": int(datetime.fromisoformat(bar['t'].replace('Z', '+00:00')).timestamp()),
                    "open": round(bar['o'], 2),
                    "high": round(bar['h'], 2),
                    "low": round(bar['l'], 2),
                    "price": round(bar['c'], 2),  # Close price
                    "volume": bar['v']
                })
            except Exception as e:
                logger.error(f"Error parsing bar data: {e}, bar: {bar}")
                continue
        
        logger.info(f"Returning {len(formatted_data)} bars for {symbol}")
        return formatted_data
        
    except Exception as e:
        logger.error(f"Error fetching Alpaca bars for {symbol}: {str(e)}")
        return []

@router.get("/test-bars/{symbol}")
def test_bars(symbol: str):
    """Test fetching bars data with detailed logging"""
    try:
        if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
            return {"error": "Alpaca API credentials not configured"}
        
        # Test with specific parameters - use a known date with market data
        # Using December 2024 as a test date
        test_date = datetime(2024, 12, 20, 15, 0, 0, tzinfo=pytz.UTC)  # 3 PM UTC = 10 AM ET
        start = test_date - timedelta(hours=2)
        
        endpoint = f"/v2/stocks/{symbol.upper()}/bars"
        params = {
            "timeframe": "1Min",
            "start": start.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "end": test_date.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "limit": 10,
            "feed": "iex"
        }
        
        headers = {
            "APCA-API-KEY-ID": ALPACA_API_KEY,
            "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY
        }
        
        url = f"{ALPACA_BASE_URL}{endpoint}"
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        return {
            "url": url,
            "params": params,
            "status_code": response.status_code,
            "response": response.json() if response.status_code == 200 else response.text,
            "headers_sent": {k: v[:10] + "..." if k.startswith("APCA") else v for k, v in headers.items()}
        }
        
    except Exception as e:
        return {"error": str(e)}

@router.get("/test")
def test_connection():
    """Test the Alpaca connection"""
    try:
        if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
            return {
                "status": "error",
                "message": "Alpaca API credentials not configured",
                "instruction": "Please set ALPACA_API_KEY and ALPACA_SECRET_KEY in your .env file"
            }
        
        # Test quote
        quote_data = get_alpaca_quote("AAPL")
        
        # Test bars
        now = datetime.now()
        market_open = now.replace(hour=14, minute=30, second=0, microsecond=0)  # 9:30 AM ET in UTC
        
        if now.timestamp() < market_open.timestamp():
            market_open = market_open - timedelta(days=1)
        
        start_time = market_open.isoformat() + "Z"
        end_time = now.isoformat() + "Z"
        
        bars_data = get_alpaca_bars("AAPL", "1Min", start_time, end_time)
        
        return {
            "status": "success" if quote_data else "partial",
            "message": "Alpaca connection test results",
            "credentials_configured": True,
            "quote_test": {
                "success": bool(quote_data),
                "data": quote_data
            },
            "bars_test": {
                "success": len(bars_data) > 0,
                "count": len(bars_data),
                "sample": bars_data[:3] if bars_data else None
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Alpaca connection failed: {str(e)}",
            "credentials_configured": bool(ALPACA_API_KEY and ALPACA_SECRET_KEY)
        }

@router.get("/history/{symbol}")
def get_stock_history(
    symbol: str,
    period: str = "1d",
    interval: str = "1m"
):
    """Get historical data for a stock using Alpaca"""
    try:
        if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
            raise HTTPException(status_code=503, detail="Alpaca API credentials not configured")
        
        # Get current time
        et_tz = pytz.timezone('US/Eastern')
        utc_tz = pytz.UTC
        
        # Since the system date might be in the future (2025), we need to use
        # the most recent available trading day. Let's try to find the most recent
        # trading day with data by checking backwards from today
        
        # Get current time in Eastern Time
        now_utc = datetime.now(utc_tz)
        now_et = now_utc.astimezone(et_tz)
        
        # Map periods to time ranges
        if period == "1d":
            # Market hours: 9:30 AM - 4:00 PM ET
            market_open_time = datetime.strptime("09:30", "%H:%M").time()
            market_close_time = datetime.strptime("16:00", "%H:%M").time()
            
            # Get today's date in ET
            today_et = now_et.date()
            
            # Check if market is closed (weekend or after hours)
            if now_et.weekday() >= 5:  # Saturday = 5, Sunday = 6
                # Use last Friday
                days_back = now_et.weekday() - 4
                today_et = today_et - timedelta(days=days_back)
            elif now_et.time() < market_open_time:
                # Before market open, use previous trading day
                if now_et.weekday() == 0:  # Monday
                    today_et = today_et - timedelta(days=3)  # Last Friday
                else:
                    today_et = today_et - timedelta(days=1)
            
            # Create market open and close times for today
            market_open_et = et_tz.localize(datetime.combine(today_et, market_open_time))
            
            # If current time is during market hours, use current time as end
            if now_et.date() == today_et and market_open_time <= now_et.time() <= market_close_time:
                end_time = now_utc
            else:
                market_close_et = et_tz.localize(datetime.combine(today_et, market_close_time))
                end_time = market_close_et.astimezone(utc_tz)
            
            # Start time is always market open
            start_time = market_open_et.astimezone(utc_tz)
            
            timeframe = "1Min"
            
            logger.info(f"Market session: {start_time} to {end_time} (ET: {start_time.astimezone(et_tz)} to {end_time.astimezone(et_tz)})")
            
            # Remove timezone info for API compatibility
            start_time = start_time.replace(tzinfo=None)
            end_time = end_time.replace(tzinfo=None)
        else:
            # For longer periods, use daily data
            period_days = {
                "5d": 5,
                "1mo": 30,
                "3mo": 90,
                "6mo": 180,
                "1y": 365
            }
            days = period_days.get(period, 5)
            
            start_time = now - timedelta(days=days)
            end_time = now
            timeframe = "1Day"
        
        # Format times for Alpaca API (RFC3339 format)
        # Remove microseconds and ensure proper timezone format
        start_str = start_time.strftime('%Y-%m-%dT%H:%M:%SZ')
        end_str = end_time.strftime('%Y-%m-%dT%H:%M:%SZ')
        
        logger.info(f"Fetching {symbol} from {start_str} to {end_str} with timeframe {timeframe}")
        
        # Get bars data with caching
        cache_key = f"alpaca_bars_{symbol}_{period}_{interval}_{int(time.time() // 60)}"  # Cache per minute
        bars = get_cached_or_fetch(
            cache_key,
            get_alpaca_bars,
            symbol,
            timeframe,
            start_str,
            end_str
        )
        
        # Log the result
        logger.info(f"Got {len(bars) if bars else 0} bars for {symbol}")
        
        if not bars:
            logger.warning(f"No bars returned for {symbol} between {start_str} and {end_str}")
            raise HTTPException(status_code=404, detail=f"No historical data found for {symbol}")
        
        return bars
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching history for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical data: {str(e)}")

@router.get("/quote/{symbol}")
def get_single_quote(symbol: str):
    """Get detailed quote for a single stock"""
    try:
        stock_data = get_cached_or_fetch(
            f"alpaca_quote_{symbol}",
            get_alpaca_quote,
            symbol
        )
        
        if not stock_data:
            raise HTTPException(status_code=404, detail=f"No data found for symbol {symbol}")
        
        return stock_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch quote: {str(e)}")

@router.get("/followed")
def get_followed_stocks_live(
    current_user: User = Depends(get_current_user)
):
    """Get live market data for user's followed stocks using Alpaca"""
    try:
        followed_stocks = current_user.followed_stocks
        
        if not followed_stocks:
            return {}
        
        result = {}
        for stock in followed_stocks:
            symbol = stock.symbol.upper()
            
            stock_data = get_cached_or_fetch(
                f"alpaca_quote_{symbol}",
                get_alpaca_quote,
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