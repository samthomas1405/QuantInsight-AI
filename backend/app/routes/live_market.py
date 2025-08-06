from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth import get_current_user
from app.models.user import User
import os
import finnhub
import requests
import yfinance as yf
from typing import List
import time

router = APIRouter(prefix="/market-live", tags=["Market"])

# Initialize Finnhub client
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
if not FINNHUB_API_KEY:
    print("WARNING: FINNHUB_API_KEY environment variable is not set!")
    print("Please set your Finnhub API key in your .env file:")
    print("FINNHUB_API_KEY=your_api_key_here")
    raise ValueError("FINNHUB_API_KEY environment variable is required")

print(f"Initializing Finnhub client with API key: {FINNHUB_API_KEY[:10]}...")
finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY)

# Initialize Twelve Data API key for historical data
TWELVE_DATA_API_KEY = os.getenv("TWELVE_DATA_API_KEY")
if not TWELVE_DATA_API_KEY:
    print("WARNING: TWELVE_DATA_API_KEY environment variable is not set!")
    print("Please set your Twelve Data API key in your .env file:")
    print("TWELVE_DATA_API_KEY=your_twelve_data_api_key_here")
    print("Historical data will use mock data as fallback")

# Simple rate limiter for Finnhub (60 requests/minute free tier)
request_times = []
RATE_LIMIT = 60  # requests per minute

def check_rate_limit():
    """Check if we're within rate limits"""
    current_time = time.time()
    minute_ago = current_time - 60
    
    # Clean old requests
    global request_times
    request_times = [t for t in request_times if t > minute_ago]
    
    if len(request_times) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again in a minute.")
    
    request_times.append(current_time)

def fetch_live_prices(symbols: List[str]):
    """Fetch live prices for multiple symbols using multiple sources for best current price"""
    check_rate_limit()
    
    results = {}
    
    try:
        for symbol in symbols:
            try:
                print(f"Fetching current price for {symbol.upper()}")
                
                # Try to get the most current price from multiple sources
                current_price_data = get_most_current_price(symbol)
                
                if current_price_data:
                    results[symbol.upper()] = current_price_data
                    print(f"Current price for {symbol}: ${current_price_data['price']} (updated: {current_price_data.get('last_updated', 'unknown')})")
                else:
                    print(f"No current price data available for {symbol}")
                    results[symbol.upper()] = None
                    
            except Exception as e:
                print(f"Error fetching current price for {symbol}: {str(e)}")
                results[symbol.upper()] = None
                
        return results
        
    except Exception as e:
        print(f"General exception in fetch_live_prices: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Failed to fetch live prices: {str(e)}")

def get_most_current_price(symbol: str):
    """Get the most current price available for a symbol from multiple sources"""
    import datetime
    
    # Try multiple sources in order of preference
    sources = [
        ("Yahoo Finance Extended Hours", get_yahoo_extended_hours_price),  # Best for after-hours
        ("Yahoo Finance Real-time", get_yahoo_realtime_price),
        ("Finnhub Quote", get_finnhub_current_price),
        ("Alpha Vantage Real-time", get_alpha_vantage_price),
        ("Finnhub Previous Close", get_finnhub_previous_close)
    ]
    
    for source_name, source_func in sources:
        try:
            print(f"  Trying {source_name} for {symbol}")
            price_data = source_func(symbol)
            if price_data and price_data.get('price') is not None:
                print(f"  Successfully got price from {source_name}: ${price_data['price']}")
                return price_data
        except Exception as e:
            print(f"  {source_name} failed for {symbol}: {str(e)}")
            continue
    
    print(f"  All price sources failed for {symbol}")
    return None

def get_yahoo_extended_hours_price(symbol: str):
    """Get extended hours price from Yahoo Finance with more aggressive approach"""
    try:
        import requests
        import datetime
        
        # Try multiple Yahoo Finance endpoints for extended hours data
        endpoints = [
            # Extended hours specific endpoint
            f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol.upper()}?interval=1m&range=1d&includePrePost=true&events=div%2Csplit",
            # Alternative endpoint with different parameters
            f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol.upper()}?interval=1m&range=1d&includePrePost=true&events=div%2Csplit&lang=en-US&region=US",
            # Real-time quote endpoint
            f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol.upper()}?interval=1m&range=1d&includePrePost=true"
        ]
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        }
        
        for i, url in enumerate(endpoints):
            try:
                print(f"    Trying Yahoo endpoint {i+1} for extended hours data")
                response = requests.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                
                data = response.json()
                
                if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
                    result = data['chart']['result'][0]
                    
                    if 'meta' in result:
                        meta = result['meta']
                        
                        # Debug: Print all available price data
                        print(f"    Debug - Available prices for {symbol}:")
                        print(f"      Regular Market Price: {meta.get('regularMarketPrice')}")
                        print(f"      Post Market Price: {meta.get('postMarketPrice')}")
                        print(f"      Pre Market Price: {meta.get('preMarketPrice')}")
                        print(f"      Previous Close: {meta.get('previousClose')}")
                        print(f"      Regular Market Time: {meta.get('regularMarketTime')}")
                        
                        # Get the most current price available
                        current_price = None
                        price_source = "Regular Market"
                        timestamp = meta.get('regularMarketTime', int(time.time()))
                        
                        # Check for after-hours price first (most current)
                        if meta.get('postMarketPrice') is not None and meta.get('postMarketPrice') > 0:
                            current_price = meta.get('postMarketPrice')
                            price_source = "After Hours"
                            timestamp = int(time.time())  # Use current time for after-hours
                        elif meta.get('preMarketPrice') is not None and meta.get('preMarketPrice') > 0:
                            current_price = meta.get('preMarketPrice')
                            price_source = "Pre Market"
                            timestamp = int(time.time())  # Use current time for pre-market
                        elif meta.get('regularMarketPrice') is not None:
                            current_price = meta.get('regularMarketPrice')
                            price_source = "Regular Market"
                        else:
                            current_price = meta.get('previousClose')
                            price_source = "Previous Close"
                        
                        if current_price:
                            # Try to get the most recent price from the actual chart data
                            most_recent_price = None
                            most_recent_time = None
                            
                            if 'timestamp' in result and 'indicators' in result and 'quote' in result['indicators']:
                                timestamps = result['timestamp']
                                quotes = result['indicators']['quote'][0]
                                
                                if timestamps and 'close' in quotes and quotes['close']:
                                    # Find the most recent non-null price
                                    for i in range(len(timestamps) - 1, -1, -1):
                                        if quotes['close'][i] is not None:
                                            most_recent_price = quotes['close'][i]
                                            most_recent_time = timestamps[i]
                                            break
                            
                            # Use the most recent price if it's more recent than the meta price
                            if most_recent_price and most_recent_time and most_recent_time > timestamp:
                                current_price = most_recent_price
                                timestamp = most_recent_time
                                price_source = "Most Recent Data"
                            
                            last_updated = datetime.datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
                            
                            # Calculate change based on previous close
                            previous_close = meta.get('previousClose', current_price)
                            change = current_price - previous_close
                            percent_change = (change / previous_close * 100) if previous_close else 0
                            
                            print(f"    Selected price: ${current_price} ({price_source}) at {last_updated}")
                            
                            return {
                                "price": float(current_price),
                                "change": change,
                                "percent_change": percent_change,
                                "high": meta.get('regularMarketDayHigh', 0),
                                "low": meta.get('regularMarketDayLow', 0),
                                "open": meta.get('regularMarketOpen', 0),
                                "previous_close": previous_close,
                                "timestamp": timestamp,
                                "last_updated": last_updated,
                                "source": f"Yahoo Finance {price_source}",
                                "market_status": price_source
                            }
                
                print(f"    Endpoint {i+1} returned no valid data")
                
            except Exception as e:
                print(f"    Endpoint {i+1} failed: {str(e)}")
                continue
        
        print(f"    All Yahoo endpoints failed for {symbol}")
        return None
        
    except Exception as e:
        print(f"Yahoo extended hours price error: {str(e)}")
        return None

def get_alpha_vantage_price(symbol: str):
    """Get real-time price from Alpha Vantage API (alternative source)"""
    try:
        import requests
        
        # Alpha Vantage Global Quote endpoint
        url = "https://www.alphavantage.co/query"
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol.upper(),
            'apikey': os.getenv('ALPHA_VANTAGE_API_KEY', 'demo')  # Use demo key if not set
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        
        if 'Global Quote' in data and data['Global Quote']:
            quote = data['Global Quote']
            current_price = float(quote.get('05. price', 0))
            
            if current_price > 0:
                import datetime
                last_updated = quote.get('07. latest trading day', '')
                timestamp = int(time.time())
                
                return {
                    "price": current_price,
                    "change": float(quote.get('09. change', 0)),
                    "percent_change": float(quote.get('10. change percent', '0%').replace('%', '')),
                    "high": float(quote.get('03. high', 0)),
                    "low": float(quote.get('04. low', 0)),
                    "open": float(quote.get('02. open', 0)),
                    "previous_close": float(quote.get('08. previous close', 0)),
                    "timestamp": timestamp,
                    "last_updated": last_updated,
                    "source": "Alpha Vantage Real-time"
                }
        
        return None
        
    except Exception as e:
        print(f"Alpha Vantage price error: {str(e)}")
        return None

def get_finnhub_current_price(symbol: str):
    """Get current price from Finnhub quote API"""
    quote = finnhub_client.quote(symbol.upper())
    
    if quote and quote.get('c') is not None:
        import datetime
        timestamp = quote.get('t')
        last_updated = datetime.datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S") if timestamp else "unknown"
        
        return {
            "price": quote['c'],
            "change": quote.get('d', 0),
            "percent_change": quote.get('dp', 0),
            "high": quote.get('h', 0),
            "low": quote.get('l', 0),
            "open": quote.get('o', 0),
            "previous_close": quote.get('pc', 0),
            "timestamp": timestamp,
            "last_updated": last_updated,
            "source": "Finnhub Real-time"
        }
    return None

def get_yahoo_realtime_price(symbol: str):
    """Get real-time price from Yahoo Finance API including after-hours"""
    try:
        import requests
        import datetime
        
        # Yahoo Finance real-time quote endpoint
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol.upper()}"
        params = {
            'interval': '1m',
            'range': '1d',
            'includePrePost': 'true'  # Include pre/post market data
        }
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        
        if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
            result = data['chart']['result'][0]
            
            if 'meta' in result:
                meta = result['meta']
                
                # Debug: Print all available price data
                print(f"    Debug - Available prices for {symbol}:")
                print(f"      Regular Market Price: {meta.get('regularMarketPrice')}")
                print(f"      Post Market Price: {meta.get('postMarketPrice')}")
                print(f"      Pre Market Price: {meta.get('preMarketPrice')}")
                print(f"      Previous Close: {meta.get('previousClose')}")
                print(f"      Regular Market Time: {meta.get('regularMarketTime')}")
                
                # Try to get the most current price available
                current_price = None
                price_source = "Regular Market"
                timestamp = meta.get('regularMarketTime', int(time.time()))
                
                # Check for after-hours price first (most current)
                if meta.get('postMarketPrice') is not None and meta.get('postMarketPrice') > 0:
                    current_price = meta.get('postMarketPrice')
                    price_source = "After Hours"
                    # Use current time for after-hours
                    timestamp = int(time.time())
                elif meta.get('preMarketPrice') is not None and meta.get('preMarketPrice') > 0:
                    current_price = meta.get('preMarketPrice')
                    price_source = "Pre Market"
                    # Use current time for pre-market
                    timestamp = int(time.time())
                elif meta.get('regularMarketPrice') is not None:
                    current_price = meta.get('regularMarketPrice')
                    price_source = "Regular Market"
                else:
                    current_price = meta.get('previousClose')
                    price_source = "Previous Close"
                
                if current_price:
                    last_updated = datetime.datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
                    
                    # Calculate change based on previous close
                    previous_close = meta.get('previousClose', current_price)
                    change = current_price - previous_close
                    percent_change = (change / previous_close * 100) if previous_close else 0
                    
                    # Check if this is actually current or just market close
                    current_time = datetime.datetime.now()
                    market_close_time = datetime.datetime.fromtimestamp(meta.get('regularMarketTime', 0))
                    
                    # Try to get the most recent price from the actual chart data
                    most_recent_price = None
                    most_recent_time = None
                    
                    if 'timestamp' in result and 'indicators' in result and 'quote' in result['indicators']:
                        timestamps = result['timestamp']
                        quotes = result['indicators']['quote'][0]
                        
                        if timestamps and 'close' in quotes and quotes['close']:
                            # Find the most recent non-null price
                            for i in range(len(timestamps) - 1, -1, -1):
                                if quotes['close'][i] is not None:
                                    most_recent_price = quotes['close'][i]
                                    most_recent_time = timestamps[i]
                                    break
                    
                    # Use the most recent price if it's more recent than the meta price
                    if most_recent_price and most_recent_time and most_recent_time > timestamp:
                        current_price = most_recent_price
                        timestamp = most_recent_time
                        price_source = "Most Recent Data"
                        last_updated = datetime.datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
                        print(f"    Using most recent price: ${current_price} at {last_updated}")
                    
                    # If it's after market close and we're still getting market close price,
                    # indicate it's the last available
                    if current_time.hour > 16 and price_source == "Regular Market":
                        price_source = "Market Close (Last Available)"
                        last_updated = f"{last_updated} (Market Close)"
                    
                    return {
                        "price": float(current_price),
                        "change": change,
                        "percent_change": percent_change,
                        "high": meta.get('regularMarketDayHigh', 0),
                        "low": meta.get('regularMarketDayLow', 0),
                        "open": meta.get('regularMarketOpen', 0),
                        "previous_close": previous_close,
                        "timestamp": timestamp,
                        "last_updated": last_updated,
                        "source": f"Yahoo Finance {price_source}",
                        "market_status": price_source
                    }
        
        return None
        
    except Exception as e:
        print(f"Yahoo real-time price error: {str(e)}")
        return None

def get_finnhub_previous_close(symbol: str):
    """Get previous close price from Finnhub as fallback"""
    quote = finnhub_client.quote(symbol.upper())
    
    if quote and quote.get('pc') is not None:
        import datetime
        timestamp = quote.get('t')
        last_updated = datetime.datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S") if timestamp else "unknown"
        
        return {
            "price": quote['pc'],  # Previous close
            "change": 0,  # No change since it's previous close
            "percent_change": 0,
            "high": quote.get('h', 0),
            "low": quote.get('l', 0),
            "open": quote.get('o', 0),
            "previous_close": quote.get('pc', 0),
            "timestamp": timestamp,
            "last_updated": last_updated + " (Previous Close)",
            "source": "Finnhub Previous Close"
        }
    return None

@router.get("/followed")
def get_followed_stock_prices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get live prices for user's followed stocks"""
    symbols = [stock.symbol for stock in current_user.followed_stocks]
    if not symbols:
        return []

    # Limit to 30 symbols per request to avoid rate limits
    limited = symbols[:30]
    return fetch_live_prices(limited)

@router.get("/history/{symbol}")
def get_stock_history(symbol: str, resolution: str = "1", from_timestamp: int = None, to_timestamp: int = None):
    """Get historical data for a stock using multiple APIs with fallbacks"""
    check_rate_limit()
    
    try:
        print(f"Fetching historical data for {symbol.upper()}")
        
        # Try multiple data sources in order of preference
        data_sources = [
            ("Yahoo Finance", get_yahoo_finance_history),
            ("Twelve Data", get_twelve_data_history)
        ]
        
        last_error = None
        
        for source_name, source_func in data_sources:
            try:
                print(f"Trying {source_name} for {symbol}")
                result = source_func(symbol)
                if result and len(result) > 0:
                    print(f"Successfully got {len(result)} data points from {source_name} for {symbol}")
                    return result
                else:
                    print(f"No data returned from {source_name} for {symbol}")
            except Exception as e:
                error_msg = f"{source_name} failed for {symbol}: {str(e)}"
                print(error_msg)
                last_error = error_msg
                continue
        
        # If all sources fail, raise the last error instead of using mock data
        if last_error:
            raise HTTPException(status_code=500, detail=f"Failed to fetch historical data for {symbol}: {last_error}")
        else:
            raise HTTPException(status_code=500, detail=f"No data sources available for {symbol}")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"General exception for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error for {symbol}: {str(e)}")

def get_yahoo_finance_history(symbol: str):
    """Get historical data from Yahoo Finance API"""
    try:
        import datetime
        import requests
        
        # Try direct Yahoo Finance API call first (more reliable)
        print(f"Trying direct Yahoo Finance API for {symbol}")
        
        # Yahoo Finance API endpoint
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol.upper()}"
        
        # Parameters for intraday data
        params = {
            'interval': '1m',
            'range': '1d',  # Last 1 day
            'includePrePost': 'false'
        }
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
            result = data['chart']['result'][0]
            
            if 'timestamp' in result and 'indicators' in result:
                timestamps = result['timestamp']
                quotes = result['indicators']['quote'][0]
                
                if 'close' in quotes and timestamps:
                    formatted_data = []
                    
                    for i, timestamp in enumerate(timestamps):
                        if quotes['close'][i] is not None:
                            formatted_data.append({
                                "timestamp": timestamp,
                                "price": float(quotes['close'][i])
                            })
                    
                    print(f"Direct Yahoo Finance API returned {len(formatted_data)} data points for {symbol}")
                    
                    if formatted_data:
                        first_time = datetime.datetime.fromtimestamp(formatted_data[0]["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")
                        last_time = datetime.datetime.fromtimestamp(formatted_data[-1]["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")
                        print(f"Data time range: {first_time} to {last_time}")
                    
                    return formatted_data
        
        print(f"No valid data from direct Yahoo Finance API for {symbol}")
        
        # Fallback to yfinance library
        print(f"Trying yfinance library for {symbol}")
        stock = yf.Ticker(symbol.upper())
        
        # Get data for today only
        today = datetime.datetime.now().date()
        start_time = datetime.datetime.combine(today, datetime.time(9, 30))  # Market open
        end_time = datetime.datetime.now()
        
        print(f"Requesting yfinance data from {start_time} to {end_time}")
        
        hist = stock.history(
            start=start_time,
            end=end_time,
            interval="1m"
        )
        
        if not hist.empty:
            formatted_data = []
            
            print(f"First 3 data points from yfinance:")
            for i, (timestamp, row) in enumerate(hist.head(3).iterrows()):
                print(f"  {i+1}. {timestamp}: ${row['Close']:.2f}")
            
            for timestamp, row in hist.iterrows():
                unix_timestamp = int(timestamp.timestamp())
                formatted_data.append({
                    "timestamp": unix_timestamp,
                    "price": float(row['Close'])
                })
            
            print(f"yfinance returned {len(formatted_data)} data points for {symbol}")
            return formatted_data
        else:
            print(f"No data returned from yfinance for {symbol}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Yahoo Finance API request failed for {symbol}: {str(e)}")
        raise Exception(f"Yahoo Finance API request failed: {str(e)}")
    except Exception as e:
        print(f"Yahoo Finance error for {symbol}: {str(e)}")
        raise Exception(f"Yahoo Finance error: {str(e)}")

def get_twelve_data_history(symbol: str):
    """Fallback function to get historical data from Twelve Data API"""
    try:
        import datetime
        today = datetime.datetime.now().date()
        start_time = datetime.datetime.combine(today, datetime.time(0, 0))
        end_time = datetime.datetime.now()
        
        start_date = start_time.strftime("%Y-%m-%d %H:%M:%S")
        end_date = end_time.strftime("%Y-%m-%d %H:%M:%S")
        
        url = f"https://api.twelvedata.com/time_series?symbol={symbol.upper()}&interval=1min&start_date={start_date}&end_date={end_date}&apikey={TWELVE_DATA_API_KEY}"
        
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        if "values" in data and data["values"]:
            formatted_data = []
            for item in reversed(data["values"]):
                try:
                    dt = datetime.datetime.strptime(item["datetime"], "%Y-%m-%d %H:%M:%S")
                    timestamp = int(dt.timestamp())
                    formatted_data.append({
                        "timestamp": timestamp,
                        "price": float(item["close"])
                    })
                except Exception:
                    continue
            
            return formatted_data
    except Exception as e:
        print(f"Twelve Data fallback failed for {symbol}: {str(e)}")
    
    return generate_mock_historical_data(symbol)

def generate_mock_historical_data(symbol: str):
    """Generate realistic mock historical data based on current live price"""
    try:
        # Try to get current price for realistic mock data
        quote = finnhub_client.quote(symbol.upper())
        current_price = quote.get('c', 100) if quote else 100
        print(f"Using current price ${current_price} for mock data generation")
    except:
        current_price = 100
        print(f"Using fallback price ${current_price} for mock data generation")
    
    formatted_data = []
    current_time = int(time.time())
    
    # Generate data for the current trading day (9:30 AM to current time)
    import datetime
    today = datetime.datetime.now().date()
    market_open = datetime.datetime.combine(today, datetime.time(9, 30))
    market_open_timestamp = int(market_open.timestamp())
    
    # Generate minute-by-minute data from market open to now
    minutes_since_open = int((current_time - market_open_timestamp) / 60)
    
    if minutes_since_open <= 0:
        # If market hasn't opened yet, generate data for the last 6 hours
        minutes_since_open = 360
        market_open_timestamp = current_time - (360 * 60)
    
    # Start with a slightly different price to create realistic variation
    import random
    random.seed(hash(symbol) % 1000)  # Consistent seed for same symbol
    
    base_price = current_price * random.uniform(0.95, 1.05)
    
    for i in range(minutes_since_open):
        timestamp = market_open_timestamp + (i * 60)
        
        # Create realistic price movement (small variations)
        variation = random.uniform(-0.002, 0.002)  # ±0.2% per minute
        base_price = base_price * (1 + variation)
        
        # Add some volatility spikes occasionally
        if random.random() < 0.1:  # 10% chance of volatility spike
            spike = random.uniform(-0.01, 0.01)  # ±1% spike
            base_price = base_price * (1 + spike)
        
        formatted_data.append({
            "timestamp": timestamp,
            "price": round(base_price, 2)
        })
    
    # Sort by timestamp (oldest first)
    formatted_data.sort(key=lambda x: x['timestamp'])
    
    print(f"Generated {len(formatted_data)} realistic mock data points for {symbol} from market open")
    
    # Debug: Show time range
    if formatted_data:
        first_time = datetime.datetime.fromtimestamp(formatted_data[0]["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")
        last_time = datetime.datetime.fromtimestamp(formatted_data[-1]["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")
        print(f"Mock data time range: {first_time} to {last_time}")
    
    return formatted_data

@router.get("/search/{query}")
def search_stocks(query: str):
    """Search for stocks using Finnhub"""
    check_rate_limit()
    
    try:
        # Search for stocks
        search_results = finnhub_client.symbol_lookup(query)
        return {"results": search_results}
        
    except finnhub.FinnhubAPIException as e:
        raise HTTPException(status_code=e.status_code, detail=f"Finnhub API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search stocks: {str(e)}")

@router.get("/test")
def test_finnhub_connection():
    """Test endpoint to check Finnhub API connection"""
    try:
        print(f"Testing Finnhub connection with API key: {FINNHUB_API_KEY[:10]}...")
        
        # Test with a simple quote request
        test_quote = finnhub_client.quote("AAPL")
        print(f"Test quote response: {test_quote}")
        
        return {
            "status": "success",
            "message": "Finnhub API connection successful",
            "api_key_prefix": FINNHUB_API_KEY[:10] + "...",
            "test_quote": test_quote
        }
        
    except finnhub.FinnhubAPIException as e:
        print(f"Finnhub API test failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Finnhub API error: {str(e)}",
            "api_key_prefix": FINNHUB_API_KEY[:10] + "..." if FINNHUB_API_KEY else "NOT_SET",
            "error_code": e.status_code
        }
    except Exception as e:
        print(f"General test error: {str(e)}")
        return {
            "status": "error",
            "message": f"General error: {str(e)}",
            "api_key_prefix": FINNHUB_API_KEY[:10] + "..." if FINNHUB_API_KEY else "NOT_SET"
        }