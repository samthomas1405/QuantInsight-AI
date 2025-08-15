from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth import get_current_user
from app.models.user import User
import os
import yfinance as yf
import requests
from typing import List, Dict, Optional
import time
from datetime import datetime, timedelta
import pytz
from functools import lru_cache
import threading

router = APIRouter(prefix="/market-live", tags=["Market"])

# Yahoo Finance doesn't require API key
print("Initializing market data service with Yahoo Finance...")

# Simple cache with TTL
cache = {}
cache_lock = threading.Lock()
CACHE_TTL = 60  # Cache for 60 seconds

def get_cached_or_fetch(key: str, fetch_func, *args, **kwargs):
    """Get data from cache or fetch if expired"""
    with cache_lock:
        now = time.time()
        if key in cache:
            data, timestamp = cache[key]
            if now - timestamp < CACHE_TTL:
                return data
        
        # Fetch new data
        data = fetch_func(*args, **kwargs)
        if data is not None:
            cache[key] = (data, now)
        return data

def get_yahoo_finance_data(symbol: str) -> Optional[Dict]:
    """Get comprehensive stock data from Yahoo Finance"""
    try:
        # Use download method which is more reliable and doesn't hit info endpoint
        ticker_symbol = symbol.upper()
        
        # Get today's data with 1-minute intervals
        end_date = datetime.now()
        start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Download data without hitting the info endpoint (which causes rate limits)
        current_data = yf.download(
            ticker_symbol, 
            start=start_date, 
            end=end_date, 
            interval="1m",
            progress=False,
            show_errors=False
        )
        
        if current_data.empty:
            # Try to get at least daily data
            current_data = yf.download(
                ticker_symbol,
                period="1d",
                interval="1d",
                progress=False,
                show_errors=False
            )
            
            if current_data.empty:
                print(f"No data available for {symbol}")
                return None
        
        # Get the latest values
        latest_price = float(current_data['Close'].iloc[-1])
        latest_volume = int(current_data['Volume'].iloc[-1])
        
        # Calculate daily change
        today_open = float(current_data['Open'].iloc[0])
        price_change = latest_price - today_open
        percent_change = (price_change / today_open) * 100 if today_open > 0 else 0
        
        # Get day's high and low
        day_high = float(current_data['High'].max())
        day_low = float(current_data['Low'].min())
        
        return {
            "symbol": ticker_symbol,
            "price": round(latest_price, 2),
            "change": round(price_change, 2),
            "percent_change": round(percent_change, 2),
            "volume": latest_volume,
            "high": round(day_high, 2),
            "low": round(day_low, 2),
            "open": round(today_open, 2),
            "previous_close": round(today_open, 2),  # Using open as approximation
            "last_updated": datetime.now().isoformat(),
            "market_cap": 0,  # Skip to avoid rate limits
            "name": ticker_symbol  # Just use symbol as name to avoid info call
        }
        
    except Exception as e:
        print(f"Error fetching Yahoo Finance data for {symbol}: {str(e)}")
        return None

def get_yahoo_finance_history(symbol: str, period: str = "1d", interval: str = "1m") -> List[Dict]:
    """Get historical data from Yahoo Finance"""
    try:
        ticker_symbol = symbol.upper()
        
        # Use download method to avoid rate limits
        hist = yf.download(
            ticker_symbol,
            period=period,
            interval=interval,
            progress=False,
            show_errors=False
        )
        
        if hist.empty:
            print(f"No historical data available for {symbol}")
            return []
        
        # Convert to our format
        formatted_data = []
        for index, row in hist.iterrows():
            formatted_data.append({
                "timestamp": int(index.timestamp()),
                "price": round(float(row['Close']), 2),
                "high": round(float(row['High']), 2),
                "low": round(float(row['Low']), 2),
                "open": round(float(row['Open']), 2),
                "volume": int(row['Volume'])
            })
        
        return formatted_data
        
    except Exception as e:
        print(f"Error fetching Yahoo Finance history for {symbol}: {str(e)}")
        return []

def get_extended_market_data(symbol: str) -> Optional[Dict]:
    """Get extended hours trading data from Yahoo Finance"""
    try:
        # Try to get pre/post market data using requests
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol.upper()}"
        params = {
            'interval': '1m',
            'range': '1d',
            'includePrePost': 'true',
            'events': 'div,split'
        }
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
            result = data['chart']['result'][0]
            meta = result.get('meta', {})
            
            # Extract all available prices
            regular_price = meta.get('regularMarketPrice', 0)
            pre_market_price = meta.get('preMarketPrice', 0)
            post_market_price = meta.get('postMarketPrice', 0)
            
            # Determine current price based on market status
            current_price = regular_price
            market_state = meta.get('marketState', '')
            
            if market_state == 'PRE' and pre_market_price > 0:
                current_price = pre_market_price
            elif market_state == 'POST' and post_market_price > 0:
                current_price = post_market_price
            
            return {
                'current_price': current_price,
                'regular_price': regular_price,
                'pre_market_price': pre_market_price,
                'post_market_price': post_market_price,
                'market_state': market_state
            }
            
    except Exception as e:
        print(f"Error fetching extended market data: {str(e)}")
        
    return None

@router.get("/test")
def test_connection():
    """Test the Yahoo Finance connection"""
    try:
        # Test with a simple download call
        data = yf.download("AAPL", period="1d", interval="1m", progress=False, show_errors=False)
        if not data.empty:
            latest_price = float(data['Close'].iloc[-1])
            return {
                "status": "success",
                "message": "Yahoo Finance connection successful",
                "sample_data": {
                    "symbol": "AAPL",
                    "price": round(latest_price, 2),
                    "timestamp": datetime.now().isoformat()
                }
            }
        else:
            return {
                "status": "error",
                "message": "Yahoo Finance returned no data"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Yahoo Finance connection failed: {str(e)}"
        }

@router.get("/followed")
def get_followed_stocks_live(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get live market data for user's followed stocks"""
    try:
        # Get user's followed stocks
        followed_stocks = current_user.followed_stocks
        
        if not followed_stocks:
            return {}
        
        # Batch download all symbols at once to reduce API calls
        symbols = [stock.symbol.upper() for stock in followed_stocks]
        print(f"Fetching data for symbols: {symbols}")
        
        try:
            # Download all symbols at once
            data = yf.download(
                symbols,
                period="1d",
                interval="1m",
                group_by='ticker',
                progress=False,
                show_errors=False,
                threads=False  # Avoid threading to prevent rate limits
            )
            
            result = {}
            
            # Handle single symbol case
            if len(symbols) == 1:
                symbol = symbols[0]
                if not data.empty:
                    latest_price = float(data['Close'].iloc[-1])
                    today_open = float(data['Open'].iloc[0])
                    price_change = latest_price - today_open
                    percent_change = (price_change / today_open) * 100 if today_open > 0 else 0
                    
                    result[symbol] = {
                        "symbol": symbol,
                        "price": round(latest_price, 2),
                        "change": round(price_change, 2),
                        "percent_change": round(percent_change, 2),
                        "volume": int(data['Volume'].iloc[-1]),
                        "high": round(float(data['High'].max()), 2),
                        "low": round(float(data['Low'].min()), 2),
                        "open": round(today_open, 2),
                        "previous_close": round(today_open, 2),
                        "last_updated": datetime.now().isoformat(),
                        "market_cap": 0,
                        "name": symbol
                    }
            else:
                # Handle multiple symbols
                for symbol in symbols:
                    try:
                        if symbol in data:
                            symbol_data = data[symbol]
                            if not symbol_data['Close'].empty:
                                latest_price = float(symbol_data['Close'].iloc[-1])
                                today_open = float(symbol_data['Open'].iloc[0])
                                price_change = latest_price - today_open
                                percent_change = (price_change / today_open) * 100 if today_open > 0 else 0
                                
                                result[symbol] = {
                                    "symbol": symbol,
                                    "price": round(latest_price, 2),
                                    "change": round(price_change, 2),
                                    "percent_change": round(percent_change, 2),
                                    "volume": int(symbol_data['Volume'].iloc[-1]),
                                    "high": round(float(symbol_data['High'].max()), 2),
                                    "low": round(float(symbol_data['Low'].min()), 2),
                                    "open": round(today_open, 2),
                                    "previous_close": round(today_open, 2),
                                    "last_updated": datetime.now().isoformat(),
                                    "market_cap": 0,
                                    "name": symbol
                                }
                    except Exception as e:
                        print(f"Error processing data for {symbol}: {str(e)}")
                        # Try individual fetch as fallback with caching
                        cached_data = get_cached_or_fetch(f"stock_{symbol}", get_yahoo_finance_data, symbol)
                        if cached_data:
                            result[symbol] = cached_data
            
            return result
            
        except Exception as e:
            print(f"Batch download failed: {str(e)}, falling back to individual requests")
            # Fallback to individual requests with caching
            result = {}
            for stock in followed_stocks:
                symbol = stock.symbol
                cached_data = get_cached_or_fetch(f"stock_{symbol}", get_yahoo_finance_data, symbol)
                if cached_data:
                    result[symbol] = cached_data
                else:
                    print(f"Failed to get data for {symbol}")
            
            return result
        
    except Exception as e:
        print(f"Error in get_followed_stocks_live: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")

@router.get("/batch")
def get_batch_quotes(symbols: str):
    """Get live prices for multiple stocks (comma-separated symbols)"""
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
        
        result = {}
        for symbol in symbol_list:
            stock_data = get_yahoo_finance_data(symbol)
            if stock_data:
                result[symbol] = stock_data
        
        return result
        
    except Exception as e:
        print(f"Error in get_batch_quotes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch batch quotes: {str(e)}")

@router.get("/history/{symbol}")
def get_stock_history(symbol: str, period: str = "1d", interval: str = "1m"):
    """Get historical data for a stock using Yahoo Finance"""
    try:
        print(f"Fetching historical data for {symbol.upper()} - period: {period}, interval: {interval}")
        
        history_data = get_yahoo_finance_history(symbol, period, interval)
        
        if not history_data:
            raise HTTPException(status_code=404, detail=f"No historical data found for {symbol}")
        
        print(f"Successfully retrieved {len(history_data)} data points for {symbol}")
        return history_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching history for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical data: {str(e)}")

@router.get("/quote/{symbol}")
def get_single_quote(symbol: str):
    """Get detailed quote for a single stock"""
    try:
        stock_data = get_yahoo_finance_data(symbol)
        
        if not stock_data:
            raise HTTPException(status_code=404, detail=f"No data found for symbol {symbol}")
        
        # Get extended market data
        extended_data = get_extended_market_data(symbol)
        if extended_data:
            stock_data['extended_hours'] = extended_data
        
        # Get some historical context (last 5 days)
        history = get_yahoo_finance_history(symbol, period="5d", interval="1d")
        if history:
            stock_data['history_5d'] = history
        
        return stock_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching quote for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch quote: {str(e)}")

@router.get("/market-summary")
def get_market_summary():
    """Get summary of major market indices"""
    try:
        indices = ["^GSPC", "^DJI", "^IXIC", "^RUT"]  # S&P 500, Dow Jones, NASDAQ, Russell 2000
        
        result = {}
        for index in indices:
            data = get_yahoo_finance_data(index)
            if data:
                result[index] = data
        
        return result
        
    except Exception as e:
        print(f"Error fetching market summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch market summary: {str(e)}")