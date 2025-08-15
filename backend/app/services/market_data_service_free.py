"""
Free Market Data Service optimized for 100-200 users
Uses Yahoo Finance + Alpha Vantage with intelligent caching
"""

import os
import time
import redis
import json
import yfinance as yf
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
import requests
from functools import lru_cache

logger = logging.getLogger(__name__)

class FreeMarketDataService:
    """
    Optimized for 100-200 users using only free data sources
    Primary: Yahoo Finance (no rate limits but can be flaky)
    Backup: Alpha Vantage (500/day limit)
    """
    
    def __init__(self):
        # Initialize Redis connection
        self.redis_client = None
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                decode_responses=True
            )
            self.redis_client.ping()
            logger.info("Redis connection established")
        except:
            logger.warning("Redis not available, using in-memory cache")
            self.memory_cache = {}
            
        # Alpha Vantage config (backup only)
        self.alpha_vantage_key = os.getenv('ALPHA_VANTAGE_API_KEY')
        self.alpha_vantage_calls = 0
        self.alpha_vantage_reset_time = time.time()
        
        # Cache configuration
        self.cache_ttl = {
            'quote': 60,  # 60 seconds for quotes
            'batch': 60,  # 60 seconds for batch quotes
            'history': 300,  # 5 minutes for historical
            'company': 3600  # 1 hour for company info
        }
        
        # Popular stocks to prefetch (reduces load)
        self.popular_stocks = [
            "AAPL", "MSFT", "GOOGL", "AMZN", "META",
            "TSLA", "NVDA", "SPY", "QQQ", "DIA"
        ]
        
    async def get_quote(self, symbol: str) -> Optional[Dict]:
        """Get quote with Yahoo primary, Alpha Vantage backup"""
        cache_key = f"quote:{symbol}"
        
        # Check cache first
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            cached_data['from_cache'] = True
            return cached_data
            
        # Try Yahoo Finance first
        try:
            data = self._get_yahoo_quote(symbol)
            if data:
                self._set_cache(cache_key, data, self.cache_ttl['quote'])
                data['from_cache'] = False
                return data
        except Exception as e:
            logger.warning(f"Yahoo Finance failed for {symbol}: {e}")
            
        # Fallback to Alpha Vantage if available
        if self.alpha_vantage_key and self._can_use_alpha_vantage():
            try:
                data = await self._get_alpha_vantage_quote(symbol)
                if data:
                    self._set_cache(cache_key, data, self.cache_ttl['quote'])
                    data['from_cache'] = False
                    return data
            except Exception as e:
                logger.error(f"Alpha Vantage failed for {symbol}: {e}")
                
        return None
        
    def _get_yahoo_quote(self, symbol: str) -> Optional[Dict]:
        """Get quote from Yahoo Finance"""
        try:
            ticker = yf.Ticker(symbol)
            
            # Get current data
            info = ticker.info
            
            # Get today's trading data
            today_data = ticker.history(period="1d", interval="1m")
            
            if today_data.empty:
                # Try daily data as fallback
                today_data = ticker.history(period="1d")
                
            if not today_data.empty:
                current_price = float(today_data['Close'].iloc[-1])
                open_price = float(today_data['Open'].iloc[0])
                high = float(today_data['High'].max())
                low = float(today_data['Low'].min())
                volume = int(today_data['Volume'].sum())
                
                change = current_price - open_price
                change_percent = (change / open_price * 100) if open_price > 0 else 0
                
                return {
                    'symbol': symbol.upper(),
                    'price': round(current_price, 2),
                    'change': round(change, 2),
                    'change_percent': round(change_percent, 2),
                    'volume': volume,
                    'high': round(high, 2),
                    'low': round(low, 2),
                    'open': round(open_price, 2),
                    'previous_close': info.get('previousClose', open_price),
                    'market_cap': info.get('marketCap', 0),
                    'name': info.get('longName', symbol),
                    'provider': 'yahoo',
                    'timestamp': time.time()
                }
                
        except Exception as e:
            logger.error(f"Yahoo quote error for {symbol}: {e}")
            
        return None
        
    async def _get_alpha_vantage_quote(self, symbol: str) -> Optional[Dict]:
        """Get quote from Alpha Vantage (backup)"""
        if not self.alpha_vantage_key:
            return None
            
        url = "https://www.alphavantage.co/query"
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol,
            'apikey': self.alpha_vantage_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if 'Global Quote' in data and data['Global Quote']:
            quote = data['Global Quote']
            return {
                'symbol': symbol.upper(),
                'price': float(quote.get('05. price', 0)),
                'open': float(quote.get('02. open', 0)),
                'high': float(quote.get('03. high', 0)),
                'low': float(quote.get('04. low', 0)),
                'volume': int(quote.get('06. volume', 0)),
                'change': float(quote.get('09. change', 0)),
                'change_percent': float(quote.get('10. change percent', '0').rstrip('%')),
                'previous_close': float(quote.get('08. previous close', 0)),
                'provider': 'alpha_vantage',
                'timestamp': time.time()
            }
            
        return None
        
    async def get_batch_quotes(self, symbols: List[str]) -> Dict[str, Dict]:
        """Get multiple quotes efficiently"""
        results = {}
        uncached_symbols = []
        
        # Check cache first
        for symbol in symbols:
            cache_key = f"quote:{symbol}"
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                cached_data['from_cache'] = True
                results[symbol] = cached_data
            else:
                uncached_symbols.append(symbol)
                
        # Batch fetch from Yahoo (more efficient)
        if uncached_symbols:
            try:
                # Yahoo Finance can handle batch downloads
                data = yf.download(
                    uncached_symbols,
                    period="1d",
                    interval="1m",
                    group_by='ticker',
                    progress=False,
                    show_errors=False
                )
                
                # Process batch results
                if len(uncached_symbols) == 1:
                    # Single symbol case
                    symbol = uncached_symbols[0]
                    if not data.empty:
                        quote_data = self._process_yahoo_batch_data(symbol, data)
                        if quote_data:
                            results[symbol] = quote_data
                            self._set_cache(f"quote:{symbol}", quote_data, self.cache_ttl['batch'])
                else:
                    # Multiple symbols
                    for symbol in uncached_symbols:
                        if symbol in data:
                            symbol_data = data[symbol]
                            quote_data = self._process_yahoo_batch_data(symbol, symbol_data)
                            if quote_data:
                                results[symbol] = quote_data
                                self._set_cache(f"quote:{symbol}", quote_data, self.cache_ttl['batch'])
                                
            except Exception as e:
                logger.error(f"Batch quote error: {e}")
                
                # Fallback to individual fetches
                for symbol in uncached_symbols:
                    quote = await self.get_quote(symbol)
                    if quote:
                        results[symbol] = quote
                        
        return results
        
    def _process_yahoo_batch_data(self, symbol: str, data) -> Optional[Dict]:
        """Process Yahoo batch download data"""
        try:
            if data.empty:
                return None
                
            current_price = float(data['Close'].iloc[-1])
            open_price = float(data['Open'].iloc[0])
            high = float(data['High'].max())
            low = float(data['Low'].min())
            volume = int(data['Volume'].sum())
            
            change = current_price - open_price
            change_percent = (change / open_price * 100) if open_price > 0 else 0
            
            return {
                'symbol': symbol.upper(),
                'price': round(current_price, 2),
                'change': round(change, 2),
                'change_percent': round(change_percent, 2),
                'volume': volume,
                'high': round(high, 2),
                'low': round(low, 2),
                'open': round(open_price, 2),
                'provider': 'yahoo',
                'from_cache': False,
                'timestamp': time.time()
            }
        except Exception as e:
            logger.error(f"Error processing Yahoo data for {symbol}: {e}")
            return None
            
    def _can_use_alpha_vantage(self) -> bool:
        """Check if we can use Alpha Vantage (rate limit)"""
        now = time.time()
        
        # Reset counter every minute
        if now - self.alpha_vantage_reset_time > 60:
            self.alpha_vantage_calls = 0
            self.alpha_vantage_reset_time = now
            
        # Check rate limit (5 per minute)
        if self.alpha_vantage_calls < 5:
            self.alpha_vantage_calls += 1
            return True
            
        return False
        
    def _get_from_cache(self, key: str) -> Optional[Dict]:
        """Get data from cache"""
        try:
            if self.redis_client:
                data = self.redis_client.get(key)
                if data:
                    return json.loads(data)
            else:
                # Memory cache fallback
                if key in self.memory_cache:
                    data, expiry = self.memory_cache[key]
                    if time.time() < expiry:
                        return data
                    else:
                        del self.memory_cache[key]
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            
        return None
        
    def _set_cache(self, key: str, data: Dict, ttl: int):
        """Set data in cache with TTL"""
        try:
            if self.redis_client:
                self.redis_client.setex(key, ttl, json.dumps(data))
            else:
                # Memory cache fallback
                self.memory_cache[key] = (data, time.time() + ttl)
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            
    async def prefetch_popular_stocks(self):
        """Prefetch popular stocks to reduce API load"""
        logger.info(f"Prefetching {len(self.popular_stocks)} popular stocks")
        await self.get_batch_quotes(self.popular_stocks)
        
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        if self.redis_client:
            try:
                info = self.redis_client.info()
                keys = self.redis_client.dbsize()
                return {
                    'type': 'redis',
                    'connected': True,
                    'total_keys': keys,
                    'memory_used': info.get('used_memory_human', 'N/A'),
                    'hit_rate': self._calculate_hit_rate(info)
                }
            except:
                pass
                
        return {
            'type': 'memory',
            'connected': False,
            'total_keys': len(self.memory_cache) if hasattr(self, 'memory_cache') else 0
        }
        
    def _calculate_hit_rate(self, info: Dict) -> float:
        """Calculate cache hit rate"""
        hits = info.get('keyspace_hits', 0)
        misses = info.get('keyspace_misses', 0)
        total = hits + misses
        return round(hits / total * 100, 2) if total > 0 else 0

# Singleton instance
free_market_service = FreeMarketDataService()