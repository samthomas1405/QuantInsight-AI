import os
import json
import requests
from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)

# Upstash Redis configuration
UPSTASH_REDIS_URL = os.getenv("UPSTASH_REDIS_REST_URL")
UPSTASH_REDIS_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")

# Check if cache is enabled
CACHE_ENABLED = bool(UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN)

def get_cache(key: str) -> Optional[Any]:
    """Get value from cache"""
    if not CACHE_ENABLED:
        return None
    
    try:
        response = requests.get(
            f"{UPSTASH_REDIS_URL}/get/{key}",
            headers={"Authorization": f"Bearer {UPSTASH_REDIS_TOKEN}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            result = data.get("result")
            if result:
                # Try to parse JSON if possible
                try:
                    return json.loads(result)
                except:
                    return result
        return None
    except Exception as e:
        logger.error(f"Cache get error: {e}")
        return None

def set_cache(key: str, value: Any, expire_seconds: int = 3600) -> bool:
    """Set value in cache with expiration"""
    if not CACHE_ENABLED:
        return False
    
    try:
        # Convert to JSON if not string
        if not isinstance(value, str):
            value = json.dumps(value)
        
        response = requests.post(
            f"{UPSTASH_REDIS_URL}/set/{key}",
            headers={"Authorization": f"Bearer {UPSTASH_REDIS_TOKEN}"},
            json={"value": value, "ex": expire_seconds}
        )
        
        return response.status_code == 200
    except Exception as e:
        logger.error(f"Cache set error: {e}")
        return False

def delete_cache(key: str) -> bool:
    """Delete value from cache"""
    if not CACHE_ENABLED:
        return False
    
    try:
        response = requests.delete(
            f"{UPSTASH_REDIS_URL}/del/{key}",
            headers={"Authorization": f"Bearer {UPSTASH_REDIS_TOKEN}"}
        )
        
        return response.status_code == 200
    except Exception as e:
        logger.error(f"Cache delete error: {e}")
        return False

# Cache key helpers
def make_cache_key(*parts) -> str:
    """Create a cache key from parts"""
    return ":".join(str(part) for part in parts)

# Common cache operations
def cache_stock_quote(symbol: str, data: dict, expire: int = 300):
    """Cache stock quote for 5 minutes"""
    key = make_cache_key("stock", "quote", symbol)
    return set_cache(key, data, expire)

def get_cached_stock_quote(symbol: str):
    """Get cached stock quote"""
    key = make_cache_key("stock", "quote", symbol)
    return get_cache(key)

def cache_market_data(data: dict, expire: int = 300):
    """Cache market summary for 5 minutes"""
    key = "market:summary"
    return set_cache(key, data, expire)

def get_cached_market_data():
    """Get cached market summary"""
    return get_cache("market:summary")

# Log cache status on startup
if CACHE_ENABLED:
    logger.info("✅ Upstash Redis cache enabled")
else:
    logger.info("ℹ️ Running without cache (Upstash not configured)")