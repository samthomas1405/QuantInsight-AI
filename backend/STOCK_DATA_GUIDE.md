# Stock Data API Guide - Cost-Effective Solutions

## Quick Start (Cheapest to Most Expensive)

### 1. Alpha Vantage (FREE - Recommended to Start)
```bash
# Get your free API key at: https://www.alphavantage.co/support/#api-key
export ALPHA_VANTAGE_API_KEY="your_key_here"

# Test endpoint: http://localhost:8000/market-alpha/test
```

**Limits:**
- Free: 5 API calls/minute, 500 calls/day
- With caching: Can serve 1000s of users

### 2. Polygon.io (Best Value at Scale)
```bash
# Get your free API key at: https://polygon.io/
export POLYGON_API_KEY="your_key_here"

# Test endpoint: http://localhost:8000/market-polygon/test
```

**Limits:**
- Free: 5 API calls/minute
- Starter ($29/month): Unlimited calls

### 3. Twelve Data (Alternative Option)
```bash
# Sign up at: https://twelvedata.com/
export TWELVE_DATA_API_KEY="your_key_here"
```

**Limits:**
- Free: 800 API calls/day
- Pro ($29/month): 60,000 API calls/day

## Cost Optimization Strategy

### For 100-1000 Users (FREE)
1. Use Alpha Vantage with aggressive caching
2. Cache duration: 5 minutes for quotes
3. Background worker fetches top 20 stocks every 5 minutes
4. Cost: $0

### For 1000-10,000 Users (~$30/month)
1. Polygon.io Starter plan ($29/month)
2. Redis for caching
3. WebSocket connections for real-time updates
4. Cost: $29/month + Redis hosting (~$5)

### For 10,000+ Users (~$100/month)
1. Multiple data sources with fallback
2. Dedicated Redis cluster
3. CDN for static data
4. Background workers with queue system
5. Cost: $100-200/month

## Implementation Steps

1. **Start with Alpha Vantage** (FREE)
   - Sign up for free API key
   - Use the `/market-alpha` endpoints
   - Monitor usage in their dashboard

2. **Add Redis Caching** (When you hit limits)
   ```bash
   # Install Redis locally
   brew install redis  # macOS
   redis-server        # Start Redis
   ```

3. **Scale with Polygon.io** (When you have revenue)
   - Better rate limits
   - WebSocket support
   - More data types

## Current Endpoints

- `/market-alpha/followed` - Alpha Vantage (with caching)
- `/market-polygon/followed` - Polygon.io (requires API key)
- `/market-live/followed` - Yahoo Finance (rate limited)

## Monitoring Usage

Track your API usage:
- Alpha Vantage: https://www.alphavantage.co/
- Polygon.io: https://polygon.io/dashboard
- Redis: `redis-cli INFO stats`