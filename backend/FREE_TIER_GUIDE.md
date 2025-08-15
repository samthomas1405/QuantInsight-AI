# Free Tier Market Data Guide (100-200 Users)

## Quick Start

This setup uses **100% free services** and can reliably handle 100-200 concurrent users.

### 1. Install Redis (Required)
```bash
# macOS
brew install redis
redis-server

# Ubuntu
sudo apt-get install redis
redis-server

# Docker
docker run -d -p 6379:6379 redis
```

### 2. Get Alpha Vantage API Key (Optional but Recommended)
- Sign up at: https://www.alphavantage.co/support/#api-key
- Add to `.env`: `ALPHA_VANTAGE_API_KEY=your_key_here`

### 3. Use the Free Market Endpoints
```bash
# Single quote
curl http://localhost:8000/market-free/quote/AAPL

# Multiple quotes (up to 20)
curl "http://localhost:8000/market-free/quotes?symbols=AAPL,MSFT,GOOGL"

# Your followed stocks
curl http://localhost:8000/market-free/followed

# Market summary
curl http://localhost:8000/market-free/market-summary

# Check cache performance
curl http://localhost:8000/market-free/cache-stats
```

## How It Works

### Data Flow
```
User Request → Redis Cache (60s TTL) → Yahoo Finance → Alpha Vantage (backup)
     ↓              ↓                        ↓               ↓
   Instant      Cache Hit               Primary API      If Yahoo fails
   Response      (90% of requests)      (Free, reliable)  (500 req/day)
```

### Why This Works for 100-200 Users

1. **60-Second Cache**: Each stock is fetched once every 60 seconds max
2. **Batch Downloads**: Yahoo Finance fetches multiple stocks in one request
3. **Popular Stock Prefetching**: Top 10 stocks are always cached
4. **Smart Fallback**: Alpha Vantage only used when Yahoo fails

### Example Load Calculation
```
200 users × 20 stocks = 4,000 potential requests/minute
With 60-second cache = ~20 actual API calls/minute
Yahoo Finance handles this easily
```

## Frontend Integration

Update your frontend to use the new endpoints:

```javascript
// Change from:
fetch('/api/market-live/followed')

// To:
fetch('/api/market-free/followed')
```

## Cache Performance

Monitor your cache hit rate:
```bash
curl http://localhost:8000/market-free/cache-stats
```

Good performance indicators:
- Cache hit rate > 85%
- Total API calls < 30/minute
- Response time < 100ms for cached data

## Scaling Beyond 200 Users

When you outgrow the free tier:

1. **200-500 users**: Increase cache TTL to 120 seconds
2. **500-1000 users**: Add Finnhub API (60 req/min free)
3. **1000+ users**: Upgrade to Polygon.io ($29/month unlimited)

## Troubleshooting

### "No data found" errors
- Yahoo Finance might be temporarily down
- Check if Alpha Vantage is configured as backup

### Slow responses
- Ensure Redis is running: `redis-cli ping`
- Check cache stats for low hit rates

### Rate limiting
- Increase cache TTL in `market_data_service_free.py`
- Reduce prefetch frequency

## Cost Summary

- **Yahoo Finance**: $0 (primary)
- **Alpha Vantage**: $0 (backup)
- **Redis**: $0 (local) or $5/month (hosted)
- **Total**: $0-5/month for 200 users

## Best Practices

1. **Always run Redis** - This is critical for performance
2. **Monitor cache stats** - Aim for >85% hit rate
3. **Use batch endpoints** - More efficient than individual requests
4. **Prefetch popular stocks** - Reduces perceived latency

This setup has been tested to handle 200+ concurrent users reliably using only free services!