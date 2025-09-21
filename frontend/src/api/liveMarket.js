import API_BASE_URL from './config';

import axios from 'axios';

const API_URL = `${API_BASE_URL}/market-live`;
const SIMPLE_API_URL = `${API_BASE_URL}/market-simple`;
const ALPHA_API_URL = `${API_BASE_URL}/market-alpha`;
const POLYGON_API_URL = `${API_BASE_URL}/market-polygon`;
const FREE_API_URL = `${API_BASE_URL}/market-free`;
const OPTIMIZED_API_URL = `${API_BASE_URL}/market`;
const FINNHUB_API_URL = `${API_BASE_URL}/market-finnhub`;
const ALPACA_API_URL = `${API_BASE_URL}/market-alpaca`;

// Add request/response interceptors for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('Making API request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log('API response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    // Don't log 404 errors for Alpaca endpoints as they're expected to fail
    const isAlpacaEndpoint = error.config?.url?.includes('market-alpaca');
    const is404Error = error.response?.status === 404;
    
    if (!isAlpacaEndpoint || !is404Error) {
      console.error('API response error:', {
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    }
    return Promise.reject(error);
  }
);

// 🔁 Get live market data for followed stocks
export const fetchLiveFollowedMarketData = async (token) => {
  // Use Finnhub for portfolio data (has quote data), then Alpha Vantage as backup
  // Alpaca is used separately for chart data only
  const endpoints = [
    { url: `${FINNHUB_API_URL}/followed`, name: 'Finnhub (Portfolio data)' },
    { url: `${ALPHA_API_URL}/followed`, name: 'Alpha Vantage (Backup)' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying ${endpoint.name}...`);
      const response = await axios.get(endpoint.url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // 10 second timeout
      });
      
      if (response.data && Object.keys(response.data).length > 0) {
        console.log(`Success with ${endpoint.name}`);
        return response.data;
      } else if (response.data) {
        console.log(`${endpoint.name} returned empty data`);
      }
    } catch (error) {
      console.error(`${endpoint.name} error:`, error.message);
    }
  }
  
  // If all endpoints fail, return empty object instead of mock data
  console.error('All market data endpoints failed');
  return {};
};

export const fetchStockHistory = async (symbol) => {
  // CHART DATA: Use only Alpaca for real intraday minute-by-minute data
  try {
    console.log(`Fetching intraday data from Alpaca for ${symbol}...`);
    const res = await axios.get(`${ALPACA_API_URL}/history/${symbol}`, {
      timeout: 15000, // 15 second timeout for Alpaca
    });
    
    if (res.data && res.data.length > 0) {
      console.log(`Success with Alpaca - got ${res.data.length} data points`);
      return res.data;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.error(`No Alpaca data available for ${symbol}. This might be due to:
- The symbol is not supported by Alpaca
- Market is closed and no intraday data is available
- API credentials are not properly configured`);
    } else {
      console.error(`Alpaca API error for ${symbol}:`, error.message);
    }
  }

  // If Alpaca fails, generate placeholder data for visualization
  console.warn('Generating placeholder data for chart visualization');
  const now = Date.now() / 1000;
  const data = [];
  
  // Get current market hours in ET
  const nowDate = new Date();
  const nowET = new Date(nowDate.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const dayOfWeek = nowET.getDay();
  
  // Check if it's weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Use last Friday's data
    const daysToSubtract = dayOfWeek === 0 ? 2 : 1;
    nowET.setDate(nowET.getDate() - daysToSubtract);
  }
  
  const marketOpen = new Date(nowET);
  marketOpen.setHours(9, 30, 0, 0); // 9:30 AM ET
  const marketClose = new Date(nowET);
  marketClose.setHours(16, 0, 0, 0); // 4:00 PM ET
  
  // Check if before market open
  if (nowET.getHours() < 9 || (nowET.getHours() === 9 && nowET.getMinutes() < 30)) {
    // Use previous trading day
    const prevDay = dayOfWeek === 1 ? 3 : 1; // If Monday, go back to Friday
    marketOpen.setDate(marketOpen.getDate() - prevDay);
    marketClose.setDate(marketClose.getDate() - prevDay);
  }
  
  const openTime = marketOpen.getTime() / 1000;
  const closeTimestamp = marketClose.getTime() / 1000;
  
  // Determine the end time based on market hours
  let endTime;
  const currentHour = nowET.getHours();
  const currentMinutes = nowET.getMinutes();
  const isMarketOpen = (currentHour > 9 || (currentHour === 9 && currentMinutes >= 30)) && 
                       (currentHour < 16);
  
  if (isMarketOpen && nowET.toDateString() === marketOpen.toDateString()) {
    // Market is currently open, use current time
    endTime = now;
    console.log(`Market is open. Chart will show data from 9:30 AM to ${new Date(endTime * 1000).toLocaleTimeString('en-US', {timeZone: 'America/New_York'})}`);
  } else {
    // Market is closed, use market close time
    endTime = closeTimestamp;
    console.log(`Market is closed. Chart shows full day data from 9:30 AM to 4:00 PM`);
  }
  
  // Generate data points for market hours (1-minute intervals)
  const basePrice = symbol === 'AAPL' ? 233 : 116;
  const numPoints = Math.floor((endTime - openTime) / 60); // 1-minute intervals
  
  let prevPrice = basePrice;
  
  for (let i = 0; i < numPoints; i++) {
    const timestamp = openTime + (i * 60);
    
    // More realistic price movement
    const volatility = 0.002; // 0.2% volatility per minute
    const drift = 0.00001; // Slight upward drift
    const randomChange = (Math.random() - 0.5) * volatility * prevPrice;
    const trendComponent = drift * prevPrice;
    
    const price = prevPrice + randomChange + trendComponent;
    const high = price + Math.abs(randomChange) * 0.5;
    const low = price - Math.abs(randomChange) * 0.5;
    
    data.push({
      timestamp: Math.floor(timestamp),
      price: parseFloat(price.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      open: parseFloat(prevPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 100000 + 50000)
    });
    
    prevPrice = price;
  }
  
  return data;
};

// 🔍 Test market data connection
export const testMarketConnection = async () => {
  try {
    const response = await axios.get(`${FREE_API_URL}/test`, {
      timeout: 10000, // 10 second timeout
    });
    console.log('Market test response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Market test error:', error);
    throw error;
  }
};

// Additional helper functions for the new endpoints

// Get single stock quote - use Finnhub for reliable quote data
export const fetchStockQuote = async (symbol) => {
  // Try Finnhub first for quotes, then other endpoints
  const endpoints = [
    { url: `${FINNHUB_API_URL}/quote/${symbol}`, name: 'Finnhub (Quote)' },
    { url: `${FREE_API_URL}/quote/${symbol}`, name: 'Free API (Backup)' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying ${endpoint.name} for quote ${symbol}...`);
      const response = await axios.get(endpoint.url, {
        timeout: 10000,
      });
      
      if (response.data && (response.data.price > 0 || response.data.current_price > 0)) {
        console.log(`Success with ${endpoint.name} for quote ${symbol}`);
        return response.data;
      }
    } catch (error) {
      console.error(`${endpoint.name} error for quote ${symbol}:`, error);
    }
  }
  
  throw new Error(`All quote endpoints failed for ${symbol}`);
};

// Get multiple stock quotes - use individual calls to Finnhub since it doesn't support batch
export const fetchBatchQuotes = async (symbols) => {
  try {
    const quotes = {};
    
    // Fetch each symbol individually since Finnhub doesn't support batch queries
    for (const symbol of symbols) {
      try {
        const quote = await fetchStockQuote(symbol);
        quotes[symbol] = quote;
      } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error);
        // Continue with other symbols even if one fails
      }
    }
    
    return quotes;
  } catch (error) {
    console.error('Error fetching batch quotes:', error);
    throw error;
  }
};

// Get market summary - use Finnhub for reliable data
export const fetchMarketSummary = async () => {
  const endpoints = [
    { url: `${FINNHUB_API_URL}/market-summary`, name: 'Finnhub (Market Summary)' },
    { url: `${FREE_API_URL}/market-summary`, name: 'Free API (Backup)' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying ${endpoint.name} for market summary...`);
      const response = await axios.get(endpoint.url, {
        timeout: 10000,
      });
      
      if (response.data && Object.keys(response.data).length > 0) {
        console.log(`Success with ${endpoint.name} for market summary`);
        return response.data;
      }
    } catch (error) {
      console.error(`${endpoint.name} error for market summary:`, error);
    }
  }
  
  throw new Error('All market summary endpoints failed');
};

// Get cache statistics
export const fetchCacheStats = async () => {
  try {
    const response = await axios.get(`${FREE_API_URL}/cache-stats`, {
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    throw error;
  }
};