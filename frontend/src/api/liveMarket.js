import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/market-live';
const SIMPLE_API_URL = 'http://127.0.0.1:8000/market-simple';
const ALPHA_API_URL = 'http://127.0.0.1:8000/market-alpha';
const POLYGON_API_URL = 'http://127.0.0.1:8000/market-polygon';
const FREE_API_URL = 'http://127.0.0.1:8000/market-free';
const OPTIMIZED_API_URL = 'http://127.0.0.1:8000/market';
const FINNHUB_API_URL = 'http://127.0.0.1:8000/market-finnhub';

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
    console.error('API response error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// 🔁 Get live market data for followed stocks
export const fetchLiveFollowedMarketData = async (token) => {
  // Use Finnhub as primary (reliable, 60 req/min), with fallbacks
  const endpoints = [
    { url: `${FINNHUB_API_URL}/followed`, name: 'Finnhub (Primary)' },
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
  try {
    // Use Finnhub for historical data
    const res = await axios.get(`${FINNHUB_API_URL}/history/${symbol}`, {
      timeout: 10000, // 10 second timeout
    });
    return res.data;
  } catch (error) {
    console.error('fetchStockHistory error for symbol', symbol, ':', error);
    
    // Generate fallback data for charts
    console.warn('Using fallback history data due to API error');
    const now = Date.now() / 1000;
    const data = [];
    const basePrice = symbol === 'AAPL' ? 233 : 116;
    
    // Generate data points for the last 6 hours
    for (let i = 0; i < 60; i++) {
      const timestamp = now - (60 - i) * 60 * 6; // 6 minutes apart
      const randomChange = (Math.random() - 0.5) * 2;
      const price = basePrice + randomChange;
      
      data.push({
        timestamp: Math.floor(timestamp),
        price: parseFloat(price.toFixed(2)),
        high: parseFloat((price + Math.random() * 0.5).toFixed(2)),
        low: parseFloat((price - Math.random() * 0.5).toFixed(2)),
        open: parseFloat((price + (Math.random() - 0.5) * 0.3).toFixed(2)),
        volume: Math.floor(Math.random() * 1000000)
      });
    }
    
    return data;
  }
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

// Get single stock quote
export const fetchStockQuote = async (symbol) => {
  try {
    const response = await axios.get(`${FREE_API_URL}/quote/${symbol}`, {
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw error;
  }
};

// Get multiple stock quotes
export const fetchBatchQuotes = async (symbols) => {
  try {
    const symbolsStr = symbols.join(',');
    const response = await axios.get(`${FREE_API_URL}/quotes?symbols=${symbolsStr}`, {
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching batch quotes:', error);
    throw error;
  }
};

// Get market summary
export const fetchMarketSummary = async () => {
  try {
    const response = await axios.get(`${FREE_API_URL}/market-summary`, {
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching market summary:', error);
    throw error;
  }
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