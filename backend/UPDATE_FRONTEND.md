# Frontend Update Guide

## Quick Update for Free Market Data

Update your frontend API calls to use the new optimized endpoints:

### 1. Update API Endpoints

In your `frontend/src/api/liveMarket.js` or similar file:

```javascript
// OLD endpoints (can keep as fallback)
const OLD_BASE_URL = '/api/market-live';

// NEW endpoints (use these)
const BASE_URL = '/api/market-free';

// Or use the optimized market endpoint
const OPTIMIZED_URL = '/api/market';
```

### 2. Example Updates

```javascript
// Get followed stocks
export const getFollowedStocks = async () => {
  try {
    // Use the new free endpoint
    const response = await fetch(`${BASE_URL}/followed`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching followed stocks:', error);
    throw error;
  }
};

// Get single quote
export const getStockQuote = async (symbol) => {
  const response = await fetch(`${BASE_URL}/quote/${symbol}`);
  return await response.json();
};

// Get batch quotes
export const getBatchQuotes = async (symbols) => {
  const symbolsStr = symbols.join(',');
  const response = await fetch(`${BASE_URL}/quotes?symbols=${symbolsStr}`);
  return await response.json();
};
```

### 3. Available Endpoints

All these endpoints use Yahoo Finance + Alpha Vantage (free):

- `GET /api/market-free/quote/{symbol}` - Single stock quote
- `GET /api/market-free/quotes?symbols=AAPL,MSFT` - Multiple quotes (max 20)
- `GET /api/market-free/followed` - User's followed stocks
- `GET /api/market-free/market-summary` - Major indices
- `GET /api/market-free/cache-stats` - Monitor performance

### 4. Response Format

The response format remains the same:

```json
{
  "AAPL": {
    "symbol": "AAPL",
    "price": 150.25,
    "change": 2.50,
    "change_percent": 1.69,
    "volume": 50000000,
    "high": 151.00,
    "low": 149.00,
    "open": 149.50,
    "provider": "yahoo",
    "from_cache": true
  }
}
```

### 5. Performance Tips

- The `from_cache` field tells you if data was cached
- Data is cached for 60 seconds
- Batch requests are more efficient than individual ones

No other frontend changes needed - just update the API URLs!