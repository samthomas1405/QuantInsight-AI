"""
Market Data Service with Multi-Provider Support and Caching
Handles rate limiting and failover for cost-effective scaling
"""

import os
import time
import redis
import json
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import aiohttp
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

class MarketDataService:
    """
    Unified market data service with multiple providers and intelligent caching.
    Automatically handles rate limiting and failover.
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
            
        # Provider configuration - Yahoo first, Alpha Vantage backup
        self.providers = {
            'yahoo': {
                'api_key': None,  # No API key needed
                'base_url': None,
                'rate_limit': None,  # No official limits
                'priority': 1
            },
            'alpha_vantage': {
                'api_key': os.getenv('ALPHA_VANTAGE_API_KEY'),
                'base_url': 'https://www.alphavantage.co',
                'rate_limit': {'calls': 5, 'period': 60},
                'priority': 2
            }
        }
        
        # Rate limiting tracking
        self.rate_limits = {}
        
        # Cache configuration
        self.cache_ttl = {
            'quote': 60,  # 1 minute for real-time quotes
            'history': 300,  # 5 minutes for historical data
            'company': 3600,  # 1 hour for company info
            'market_summary': 120  # 2 minutes for market indices
        }
        
    async def get_quote(self, symbol: str) -> Optional[Dict]:
        """
        Get real-time quote with automatic provider failover
        """
        cache_key = f"quote:{symbol}"
        
        # Check cache first
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data
            
        # Try providers in priority order
        for provider_name in sorted(self.providers.keys(), 
                                  key=lambda x: self.providers[x]['priority']):
            if not self._check_rate_limit(provider_name):
                continue
                
            try:
                data = await self._fetch_quote(provider_name, symbol)
                if data:
                    self._set_cache(cache_key, data, self.cache_ttl['quote'])
                    return data
            except Exception as e:
                logger.error(f"Error with {provider_name}: {e}")
                continue
                
        return None
        
    async def get_batch_quotes(self, symbols: List[str]) -> Dict[str, Dict]:
        """
        Get quotes for multiple symbols efficiently
        """
        results = {}
        
        # Check cache for each symbol
        uncached_symbols = []
        for symbol in symbols:
            cache_key = f"quote:{symbol}"
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                results[symbol] = cached_data
            else:
                uncached_symbols.append(symbol)
                
        # Fetch uncached symbols
        if uncached_symbols:
            # Try batch endpoints first (more efficient)
            batch_data = await self._fetch_batch_quotes(uncached_symbols)
            results.update(batch_data)
            
        return results
        
    async def _fetch_quote(self, provider: str, symbol: str) -> Optional[Dict]:
        """
        Fetch quote from specific provider
        """
        config = self.providers[provider]
        
        if provider == 'yahoo':
            return await self._fetch_yahoo_quote(symbol, config)
        elif provider == 'alpha_vantage':
            return await self._fetch_alpha_vantage_quote(symbol, config)
            
        return None
        
    async def _fetch_yahoo_quote(self, symbol: str, config: Dict) -> Optional[Dict]:
        """Yahoo Finance implementation"""
        try:
            import yfinance as yf
            
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
                
                return self._normalize_quote({
                    'symbol': symbol.upper(),
                    'price': current_price,
                    'change': change,
                    'change_percent': change_percent,
                    'volume': volume,
                    'high': high,
                    'low': low,
                    'open': open_price,
                    'previous_close': info.get('previousClose', open_price),
                    'provider': 'yahoo'
                })
                
        except Exception as e:
            logger.error(f"Yahoo Finance error for {symbol}: {e}")
            
        return None
        
    async def _fetch_polygon_quote(self, symbol: str, config: Dict) -> Optional[Dict]:
        """Polygon.io implementation"""
        if not config['api_key']:
            return None
            
        url = f"{config['base_url']}/v2/aggs/ticker/{symbol}/prev"
        params = {'apiKey': config['api_key']}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    if data['status'] == 'OK' and data['results']:
                        result = data['results'][0]
                        return self._normalize_quote({
                            'symbol': symbol,
                            'price': result['c'],  # Close price
                            'open': result['o'],
                            'high': result['h'],
                            'low': result['l'],
                            'volume': result['v'],
                            'timestamp': result['t'] / 1000,  # Convert to seconds
                            'provider': 'polygon'
                        })
        return None
        
    async def _fetch_alpha_vantage_quote(self, symbol: str, config: Dict) -> Optional[Dict]:
        """Alpha Vantage implementation"""
        if not config['api_key']:
            return None
            
        url = f"{config['base_url']}/query"
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol,
            'apikey': config['api_key']
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    if 'Global Quote' in data:
                        quote = data['Global Quote']
                        return self._normalize_quote({
                            'symbol': symbol,
                            'price': float(quote['05. price']),
                            'open': float(quote['02. open']),
                            'high': float(quote['03. high']),
                            'low': float(quote['04. low']),
                            'volume': int(quote['06. volume']),
                            'change': float(quote['09. change']),
                            'change_percent': quote['10. change percent'].rstrip('%'),
                            'provider': 'alpha_vantage'
                        })
        return None
        
    async def _fetch_batch_quotes(self, symbols: List[str]) -> Dict[str, Dict]:
        """
        Fetch multiple quotes efficiently using Yahoo batch endpoint
        """
        results = {}
        
        # Try Yahoo Finance batch download first
        try:
            import yfinance as yf
            
            # Yahoo Finance can handle batch downloads
            data = yf.download(
                symbols,
                period="1d",
                interval="1m",
                group_by='ticker',
                progress=False,
                show_errors=False
            )
            
            # Process batch results
            if len(symbols) == 1:
                # Single symbol case
                symbol = symbols[0]
                if not data.empty:
                    quote_data = self._process_yahoo_batch_data(symbol, data)
                    if quote_data:
                        results[symbol] = quote_data
            else:
                # Multiple symbols
                for symbol in symbols:
                    if symbol in data:
                        symbol_data = data[symbol]
                        quote_data = self._process_yahoo_batch_data(symbol, symbol_data)
                        if quote_data:
                            results[symbol] = quote_data
                            
        except Exception as e:
            logger.error(f"Yahoo batch error: {e}")
                
        # Fallback to individual requests for missing symbols
        missing_symbols = [s for s in symbols if s not in results]
        if missing_symbols:
            tasks = [self.get_quote(symbol) for symbol in missing_symbols]
            individual_results = await asyncio.gather(*tasks)
            
            for symbol, result in zip(missing_symbols, individual_results):
                if result:
                    results[symbol] = result
                    
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
            
            return self._normalize_quote({
                'symbol': symbol.upper(),
                'price': current_price,
                'change': change,
                'change_percent': change_percent,
                'volume': volume,
                'high': high,
                'low': low,
                'open': open_price,
                'provider': 'yahoo'
            })
        except Exception as e:
            logger.error(f"Error processing Yahoo data for {symbol}: {e}")
            return None
        
    def _normalize_quote(self, data: Dict) -> Dict:
        """Normalize quote data across providers"""
        # Calculate change if not provided
        if 'change' not in data and 'price' in data and 'open' in data:
            data['change'] = round(data['price'] - data['open'], 2)
            data['change_percent'] = round((data['change'] / data['open']) * 100, 2)
            
        return {
            'symbol': data.get('symbol'),
            'price': round(float(data.get('price', 0)), 2),
            'open': round(float(data.get('open', 0)), 2),
            'high': round(float(data.get('high', 0)), 2),
            'low': round(float(data.get('low', 0)), 2),
            'volume': int(data.get('volume', 0)),
            'change': round(float(data.get('change', 0)), 2),
            'change_percent': round(float(data.get('change_percent', 0)), 2),
            'timestamp': data.get('timestamp', time.time()),
            'provider': data.get('provider', 'unknown')
        }
        
    def _check_rate_limit(self, provider: str) -> bool:
        """Check if provider is within rate limits"""
        config = self.providers[provider]
        
        # No rate limit for this provider
        if not config.get('rate_limit'):
            return True
            
        # Check rate limit
        now = time.time()
        key = f"rate_limit:{provider}"
        
        if key not in self.rate_limits:
            self.rate_limits[key] = {'calls': [], 'period': config['rate_limit']['period']}
            
        # Remove old calls outside the period
        period = config['rate_limit']['period']
        self.rate_limits[key]['calls'] = [
            call_time for call_time in self.rate_limits[key]['calls']
            if now - call_time < period
        ]
        
        # Check if we can make another call
        if len(self.rate_limits[key]['calls']) < config['rate_limit']['calls']:
            self.rate_limits[key]['calls'].append(now)
            return True
            
        return False
        
    def _get_from_cache(self, key: str) -> Optional[Dict]:
        """Get data from cache (Redis or memory)"""
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
            
    async def prefetch_popular_stocks(self, symbols: List[str]):
        """
        Prefetch popular stocks to warm the cache
        Used by background workers
        """
        logger.info(f"Prefetching {len(symbols)} stocks")
        await self.get_batch_quotes(symbols)
        
    def get_cache_stats(self) -> Dict:
        """Get cache statistics for monitoring"""
        if self.redis_client:
            info = self.redis_client.info()
            return {
                'type': 'redis',
                'connected': True,
                'used_memory': info.get('used_memory_human'),
                'total_keys': self.redis_client.dbsize(),
                'hit_rate': info.get('keyspace_hits', 0) / max(info.get('keyspace_hits', 0) + info.get('keyspace_misses', 1), 1)
            }
        else:
            return {
                'type': 'memory',
                'connected': False,
                'total_keys': len(self.memory_cache),
                'hit_rate': 0  # Would need to track this
            }

# Singleton instance
market_data_service = MarketDataService()