from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth import get_current_user
from app.models.user import User
import requests
from typing import Dict, Optional, List
import time
from datetime import datetime

router = APIRouter(prefix="/market-simple", tags=["Market Simple"])

# Simple cache
_cache = {}
_cache_timeout = 30  # 30 seconds

def get_yahoo_quote_direct(symbol: str) -> Optional[Dict]:
    """Get stock data directly from Yahoo Finance API"""
    try:
        # Check cache first
        cache_key = f"{symbol}_{int(time.time() // _cache_timeout)}"
        if cache_key in _cache:
            return _cache[cache_key]
        
        # Yahoo Finance v7 API endpoint
        url = f"https://query1.finance.yahoo.com/v7/finance/quote"
        params = {
            'symbols': symbol.upper(),
            'fields': 'symbol,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,regularMarketOpen,regularMarketPreviousClose,regularMarketVolume,longName,marketState,regularMarketTime'
        }
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if 'quoteResponse' in data and 'result' in data['quoteResponse'] and data['quoteResponse']['result']:
                quote = data['quoteResponse']['result'][0]
                
                result = {
                    "symbol": quote.get('symbol', symbol.upper()),
                    "price": round(quote.get('regularMarketPrice', 0), 2),
                    "change": round(quote.get('regularMarketChange', 0), 2),
                    "percent_change": round(quote.get('regularMarketChangePercent', 0), 2),
                    "volume": quote.get('regularMarketVolume', 0),
                    "high": round(quote.get('regularMarketDayHigh', 0), 2),
                    "low": round(quote.get('regularMarketDayLow', 0), 2),
                    "open": round(quote.get('regularMarketOpen', 0), 2),
                    "previous_close": round(quote.get('regularMarketPreviousClose', 0), 2),
                    "last_updated": datetime.now().isoformat(),
                    "market_cap": 0,
                    "name": quote.get('longName', quote.get('symbol', symbol.upper())),
                    "market_state": quote.get('marketState', 'REGULAR')
                }
                
                # Cache the result
                _cache[cache_key] = result
                return result
                
        return None
        
    except Exception as e:
        print(f"Error fetching Yahoo quote for {symbol}: {str(e)}")
        return None

@router.get("/test")
def test_connection():
    """Test the connection"""
    result = get_yahoo_quote_direct("AAPL")
    if result:
        return {"status": "success", "data": result}
    else:
        return {"status": "error", "message": "Failed to fetch data"}

@router.get("/quote/{symbol}")
def get_quote(symbol: str):
    """Get a single stock quote"""
    result = get_yahoo_quote_direct(symbol)
    if result:
        return result
    else:
        raise HTTPException(status_code=404, detail=f"No data found for {symbol}")

@router.get("/batch")
def get_batch_quotes(symbols: str):
    """Get quotes for multiple symbols"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    results = {}
    
    # Add small delay between requests
    for i, symbol in enumerate(symbol_list):
        if i > 0:
            time.sleep(0.1)  # 100ms delay between requests
        
        data = get_yahoo_quote_direct(symbol)
        if data:
            results[symbol] = data
    
    return results

@router.get("/followed")
def get_followed_stocks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get data for user's followed stocks"""
    try:
        followed_stocks = current_user.followed_stocks
        
        if not followed_stocks:
            return {}
        
        results = {}
        for i, stock in enumerate(followed_stocks):
            if i > 0:
                time.sleep(0.1)  # Small delay to avoid rate limits
                
            data = get_yahoo_quote_direct(stock.symbol)
            if data:
                results[stock.symbol] = data
            else:
                print(f"Failed to get data for {stock.symbol}")
        
        return results
        
    except Exception as e:
        print(f"Error in get_followed_stocks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))