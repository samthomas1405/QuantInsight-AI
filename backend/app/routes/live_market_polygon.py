from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth import get_current_user
from app.models.user import User
import requests
from typing import Dict, Optional, List
import time
from datetime import datetime, timedelta
import os

router = APIRouter(prefix="/market-polygon", tags=["Market Polygon"])

# Polygon.io Configuration
POLYGON_API_KEY = os.getenv("POLYGON_API_KEY", "")  # You'll need to sign up for free at polygon.io
POLYGON_BASE_URL = "https://api.polygon.io"

# Simple in-memory cache
cache = {}
CACHE_TTL = 60  # 1 minute cache

def get_from_cache(key: str) -> Optional[Dict]:
    """Get data from cache"""
    if key in cache:
        data, expiry = cache[key]
        if time.time() < expiry:
            return data
        else:
            del cache[key]
    return None

def set_cache(key: str, data: Dict):
    """Set data in cache"""
    cache[key] = (data, time.time() + CACHE_TTL)

def get_polygon_quote(symbol: str) -> Optional[Dict]:
    """Get stock quote from Polygon.io"""
    try:
        # Check cache first
        cache_key = f"polygon_{symbol}"
        cached = get_from_cache(cache_key)
        if cached:
            return cached
        
        # Get last quote
        url = f"{POLYGON_BASE_URL}/v2/last/nbbo/{symbol}"
        params = {"apiKey": POLYGON_API_KEY}
        
        response = requests.get(url, params=params, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('status') == 'OK' and 'results' in data:
                quote = data['results']
                
                # Get additional data from snapshot endpoint
                snapshot_url = f"{POLYGON_BASE_URL}/v2/snapshot/locale/us/markets/stocks/tickers/{symbol}"
                snapshot_response = requests.get(snapshot_url, params=params, timeout=5)
                
                snapshot_data = {}
                if snapshot_response.status_code == 200:
                    snapshot_json = snapshot_response.json()
                    if 'ticker' in snapshot_json:
                        snapshot_data = snapshot_json['ticker']
                
                # Calculate price from bid/ask
                price = (quote.get('P', 0) + quote.get('p', 0)) / 2 if quote.get('P', 0) else 0
                
                # Use snapshot data for better information
                if snapshot_data:
                    day_data = snapshot_data.get('day', {})
                    prev_day = snapshot_data.get('prevDay', {})
                    
                    price = day_data.get('c', price)  # closing price
                    change = price - prev_day.get('c', price)
                    percent_change = (change / prev_day.get('c', price)) * 100 if prev_day.get('c', price) else 0
                    
                    result = {
                        "symbol": symbol,
                        "price": round(price, 2),
                        "change": round(change, 2),
                        "percent_change": round(percent_change, 2),
                        "volume": day_data.get('v', 0),
                        "high": round(day_data.get('h', 0), 2),
                        "low": round(day_data.get('l', 0), 2),
                        "open": round(day_data.get('o', 0), 2),
                        "previous_close": round(prev_day.get('c', 0), 2),
                        "last_updated": datetime.now().isoformat(),
                        "name": symbol
                    }
                else:
                    # Fallback to basic quote data
                    result = {
                        "symbol": symbol,
                        "price": round(price, 2),
                        "change": 0,
                        "percent_change": 0,
                        "volume": 0,
                        "high": round(price, 2),
                        "low": round(price, 2),
                        "open": round(price, 2),
                        "previous_close": round(price, 2),
                        "last_updated": datetime.now().isoformat(),
                        "name": symbol
                    }
                
                # Cache the result
                set_cache(cache_key, result)
                return result
                
        return None
        
    except Exception as e:
        print(f"Error fetching Polygon quote for {symbol}: {str(e)}")
        return None

@router.get("/test")
def test_connection():
    """Test Polygon.io connection"""
    if not POLYGON_API_KEY:
        return {
            "status": "error",
            "message": "Polygon API key not configured. Get a free key at polygon.io"
        }
    
    result = get_polygon_quote("AAPL")
    if result:
        return {
            "status": "success",
            "message": "Polygon.io connection successful",
            "data": result
        }
    else:
        return {
            "status": "error",
            "message": "Failed to fetch data from Polygon.io"
        }

@router.get("/quote/{symbol}")
def get_quote(symbol: str):
    """Get a single stock quote"""
    if not POLYGON_API_KEY:
        raise HTTPException(status_code=500, detail="Polygon API key not configured")
    
    result = get_polygon_quote(symbol.upper())
    if result:
        return result
    else:
        raise HTTPException(status_code=404, detail=f"No data found for {symbol}")

@router.get("/followed")
def get_followed_stocks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get data for user's followed stocks"""
    if not POLYGON_API_KEY:
        raise HTTPException(status_code=500, detail="Polygon API key not configured")
    
    try:
        followed_stocks = current_user.followed_stocks
        
        if not followed_stocks:
            return {}
        
        results = {}
        
        # Polygon free tier has rate limits, so we need to be careful
        for i, stock in enumerate(followed_stocks):
            if i > 0:
                time.sleep(0.1)  # Small delay between requests
            
            symbol = stock.symbol.upper()
            quote = get_polygon_quote(symbol)
            if quote:
                results[symbol] = quote
        
        return results
        
    except Exception as e:
        print(f"Error in get_followed_stocks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))