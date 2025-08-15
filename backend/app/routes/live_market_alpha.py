from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth import get_current_user
from app.models.user import User
import requests
import redis
import json
from typing import Dict, Optional, List
import time
from datetime import datetime, timedelta
import os
from threading import Lock

router = APIRouter(prefix="/market-alpha", tags=["Market Alpha Vantage"])

# Alpha Vantage Configuration
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")  # 'demo' key works for testing
ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"

# Redis Configuration (optional but recommended)
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
    print("Redis connected successfully")
except:
    redis_client = None
    REDIS_AVAILABLE = False
    print("Redis not available, using in-memory cache")

# In-memory cache fallback
memory_cache = {}
cache_lock = Lock()

# Cache settings
CACHE_TTL = 300  # 5 minutes for real-time quotes
GLOBAL_QUOTE_CACHE_TTL = 60  # 1 minute for global quotes

def get_from_cache(key: str) -> Optional[Dict]:
    """Get data from Redis or memory cache"""
    if REDIS_AVAILABLE:
        try:
            data = redis_client.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"Redis error: {e}")
    else:
        with cache_lock:
            if key in memory_cache:
                data, expiry = memory_cache[key]
                if time.time() < expiry:
                    return data
                else:
                    del memory_cache[key]
    return None

def set_cache(key: str, data: Dict, ttl: int = CACHE_TTL):
    """Set data in Redis or memory cache"""
    if REDIS_AVAILABLE:
        try:
            redis_client.setex(key, ttl, json.dumps(data))
        except Exception as e:
            print(f"Redis error: {e}")
    else:
        with cache_lock:
            memory_cache[key] = (data, time.time() + ttl)

def get_alpha_vantage_quote(symbol: str) -> Optional[Dict]:
    """Get stock quote from Alpha Vantage"""
    try:
        # Check cache first
        cache_key = f"av_quote_{symbol}"
        cached = get_from_cache(cache_key)
        if cached:
            print(f"Cache hit for {symbol}")
            return cached
        
        # Fetch from Alpha Vantage
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol,
            'apikey': ALPHA_VANTAGE_API_KEY
        }
        
        response = requests.get(ALPHA_VANTAGE_BASE_URL, params=params, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            
            if 'Global Quote' in data:
                quote = data['Global Quote']
                
                # Parse the data
                price = float(quote.get('05. price', 0))
                change = float(quote.get('09. change', 0))
                change_percent = quote.get('10. change percent', '0%').rstrip('%')
                
                result = {
                    "symbol": quote.get('01. symbol', symbol),
                    "price": round(price, 2),
                    "change": round(change, 2),
                    "percent_change": round(float(change_percent), 2),
                    "volume": int(quote.get('06. volume', 0)),
                    "high": round(float(quote.get('03. high', 0)), 2),
                    "low": round(float(quote.get('04. low', 0)), 2),
                    "open": round(float(quote.get('02. open', 0)), 2),
                    "previous_close": round(float(quote.get('08. previous close', 0)), 2),
                    "last_updated": datetime.now().isoformat(),
                    "name": symbol  # Alpha Vantage doesn't provide company names in this endpoint
                }
                
                # Cache the result
                set_cache(cache_key, result, GLOBAL_QUOTE_CACHE_TTL)
                return result
            
            elif 'Note' in data:
                print(f"Alpha Vantage API limit reached: {data['Note']}")
                return None
                
        return None
        
    except Exception as e:
        print(f"Error fetching Alpha Vantage quote for {symbol}: {str(e)}")
        return None

def get_alpha_vantage_batch(symbols: List[str]) -> Dict[str, Dict]:
    """Get multiple quotes with rate limiting"""
    results = {}
    
    # Alpha Vantage free tier: 5 API requests per minute
    for i, symbol in enumerate(symbols):
        if i > 0:
            time.sleep(12)  # 12 seconds between requests to stay under 5/minute
        
        quote = get_alpha_vantage_quote(symbol)
        if quote:
            results[symbol] = quote
    
    return results

@router.get("/test")
def test_connection():
    """Test Alpha Vantage connection"""
    result = get_alpha_vantage_quote("AAPL")
    if result:
        return {
            "status": "success",
            "message": "Alpha Vantage connection successful",
            "data": result,
            "cache_status": "Redis" if REDIS_AVAILABLE else "Memory"
        }
    else:
        return {
            "status": "error",
            "message": "Failed to fetch data from Alpha Vantage"
        }

@router.get("/quote/{symbol}")
def get_quote(symbol: str):
    """Get a single stock quote"""
    result = get_alpha_vantage_quote(symbol.upper())
    if result:
        return result
    else:
        raise HTTPException(status_code=404, detail=f"No data found for {symbol}")

@router.get("/batch")
def get_batch_quotes(symbols: str):
    """Get quotes for multiple symbols"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    results = get_alpha_vantage_batch(symbol_list)
    return results

@router.get("/followed")
def get_followed_stocks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get data for user's followed stocks with smart caching"""
    try:
        followed_stocks = current_user.followed_stocks
        
        if not followed_stocks:
            return {}
        
        results = {}
        symbols_to_fetch = []
        
        # Check cache for all symbols first
        for stock in followed_stocks:
            symbol = stock.symbol.upper()
            cached = get_from_cache(f"av_quote_{symbol}")
            if cached:
                results[symbol] = cached
            else:
                symbols_to_fetch.append(symbol)
        
        # Fetch only uncached symbols
        if symbols_to_fetch:
            print(f"Fetching {len(symbols_to_fetch)} uncached symbols: {symbols_to_fetch}")
            new_data = get_alpha_vantage_batch(symbols_to_fetch)
            results.update(new_data)
        else:
            print("All data served from cache!")
        
        return results
        
    except Exception as e:
        print(f"Error in get_followed_stocks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Alternative Free Data Sources as Fallback

def get_yfinance_fallback(symbol: str) -> Optional[Dict]:
    """Fallback to Yahoo Finance if Alpha Vantage fails"""
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        info = ticker.fast_info
        
        return {
            "symbol": symbol,
            "price": round(info.get('lastPrice', 0), 2),
            "change": round(info.get('lastPrice', 0) - info.get('previousClose', 0), 2),
            "percent_change": round(((info.get('lastPrice', 0) - info.get('previousClose', 0)) / info.get('previousClose', 1)) * 100, 2),
            "volume": int(info.get('lastVolume', 0)),
            "high": round(info.get('dayHigh', 0), 2),
            "low": round(info.get('dayLow', 0), 2),
            "open": round(info.get('open', 0), 2),
            "previous_close": round(info.get('previousClose', 0), 2),
            "last_updated": datetime.now().isoformat(),
            "name": symbol
        }
    except:
        return None

@router.get("/smart/{symbol}")
def get_smart_quote(symbol: str):
    """Smart endpoint that tries multiple sources"""
    # Try cache first
    cached = get_from_cache(f"smart_quote_{symbol}")
    if cached:
        return cached
    
    # Try Alpha Vantage
    result = get_alpha_vantage_quote(symbol)
    if result:
        set_cache(f"smart_quote_{symbol}", result, CACHE_TTL)
        return result
    
    # Try Yahoo Finance fallback
    result = get_yfinance_fallback(symbol)
    if result:
        set_cache(f"smart_quote_{symbol}", result, CACHE_TTL)
        return result
    
    raise HTTPException(status_code=404, detail=f"No data available for {symbol}")