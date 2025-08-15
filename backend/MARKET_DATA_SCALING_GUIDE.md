# Market Data Scaling Guide - Cost-Effective Solutions

## Quick Implementation Guide

### Step 1: Choose Your Provider Based on Scale

#### For 0-1,000 Users: Alpha Vantage (FREE)
```bash
# Sign up at: https://www.alphavantage.co/support/#api-key
export ALPHA_VANTAGE_API_KEY="your_key_here"
```
- **Cost**: $0/month
- **Limits**: 500 requests/day, 5/minute
- **With caching**: Serves ~5,000 requests/day

#### For 1,000-10,000 Users: Polygon.io Starter
```bash
# Sign up at: https://polygon.io/
export POLYGON_API_KEY="your_key_here"
```
- **Cost**: $29/month
- **Limits**: UNLIMITED requests
- **Best value for production**

#### For 10,000+ Users: Enhanced Setup
- Polygon.io Professional plan + Redis cluster
- Add Twelve Data as backup provider
- Cost: ~$100-200/month total

### Step 2: Enable Redis Caching

```bash
# Install Redis locally
brew install redis  # macOS
sudo apt-get install redis  # Ubuntu

# Start Redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

### Step 3: Update Your Environment

```bash
# .env file
REDIS_HOST=localhost
REDIS_PORT=6379

# Choose one or more providers
POLYGON_API_KEY=your_polygon_key
ALPHA_VANTAGE_API_KEY=your_alpha_key
# Optional: Add more providers as they become available
```

### Step 4: Update main.py

```python
# Add to your backend/app/main.py
from app.routes import market_optimized

# Register the optimized routes
app.include_router(market_optimized.router)
```

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   FastAPI   │────▶│    Redis    │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                    │
                            ▼                    │ Cache Hit
                    ┌───────────────┐           │
                    │ Market Data   │◀──────────┘
                    │   Service      │
                    └───────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌─────────────┐         ┌─────────────┐
        │  Polygon.io │         │Alpha Vantage│
        └─────────────┘         └─────────────┘
```

## Cost Breakdown by User Scale

### 100 Users
- **Provider**: Alpha Vantage (Free)
- **Caching**: Local memory
- **Cost**: $0/month

### 1,000 Users
- **Provider**: Alpha Vantage (Free) + Redis
- **Caching**: Redis (local)
- **Cost**: $0/month

### 5,000 Users
- **Provider**: Polygon.io Starter
- **Caching**: Redis (hosted)
- **Cost**: $29 (Polygon) + $5 (Redis) = $34/month

### 10,000 Users
- **Provider**: Polygon.io Starter + Alpha Vantage Premium
- **Caching**: Redis cluster
- **Cost**: $29 + $50 + $20 (Redis) = $99/month

### 50,000 Users
- **Provider**: Multiple providers
- **Caching**: Redis cluster + CDN
- **Cost**: ~$200/month

## Optimization Techniques

### 1. Intelligent Caching
- Real-time quotes: 60 seconds TTL
- Historical data: 5 minutes TTL
- Company info: 1 hour TTL

### 2. Batch Requests
- Fetch multiple symbols in one API call
- Reduces rate limit impact by 90%

### 3. Popular Stock Prefetching
- Background worker refreshes top 20 stocks
- Serves 80% of requests from cache

### 4. WebSocket Optimization (Future)
```python
# For real-time updates without polling
async def websocket_stream(symbols: List[str]):
    # Polygon.io WebSocket for real-time data
    # One connection serves all users
    pass
```

## Monitoring and Alerts

### Check Cache Performance
```bash
# Redis stats
redis-cli INFO stats

# API endpoint
curl http://localhost:8000/market/cache-stats
```

### Monitor API Usage
- Alpha Vantage: https://www.alphavantage.co/
- Polygon.io: https://polygon.io/dashboard
- (More providers can be added as needed)

## Migration Path

1. **Start**: Yahoo Finance → Alpha Vantage (Free)
2. **Growth**: Add Redis caching
3. **Scale**: Upgrade to Polygon.io ($29/month)
4. **Enterprise**: Multi-provider with failover

## Quick Test

```bash
# Test the optimized endpoint
curl http://localhost:8000/market/quote/AAPL

# Test batch quotes
curl http://localhost:8000/market/quotes?symbols=AAPL,MSFT,GOOGL

# Check cache stats
curl http://localhost:8000/market/cache-stats
```

## Production Checklist

- [ ] Set up Redis (local or hosted)
- [ ] Get API keys for at least 2 providers
- [ ] Configure environment variables
- [ ] Test failover behavior
- [ ] Monitor cache hit rates
- [ ] Set up alerts for API limits
- [ ] Plan for WebSocket upgrade