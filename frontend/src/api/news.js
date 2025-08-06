import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with token interceptor
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fetch news for specific stock symbols
export const fetchNewsForStocks = async (symbols) => {
  try {
    const response = await api.get(`/news/stocks/${symbols}`);
    return response;
  } catch (error) {
    console.error('Error fetching news for stocks:', error);
    throw error;
  }
};

// Fetch general market news
export const fetchMarketNews = async () => {
  try {
    const response = await api.get('/news/market');
    return response;
  } catch (error) {
    console.error('Error fetching market news:', error);
    throw error;
  }
};

// Fetch news for a specific stock
export const fetchStockNews = async (symbol) => {
  try {
    const response = await api.get(`/news/stock/${symbol}`);
    return response;
  } catch (error) {
    console.error('Error fetching stock news:', error);
    throw error;
  }
};

// Original functions for NewsFeed.jsx compatibility
const API_URL = 'http://127.0.0.1:8000/news/custom-summary';

export const getReports = async (userToken) => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 600000 // 60 second timeout for AI predictions
    });
    
    return response.data;
  } catch (error) {
    // Enhanced error handling for the prediction system
    if (error.response) {
      // Server responded with error status
      throw {
        ...error,
        message: error.response.data?.detail || error.response.data?.message || 'Server error occurred',
        status: error.response.status
      };
    } else if (error.request) {
      // Request timeout or network error
      throw {
        ...error,
        message: 'Network error or request timeout. The AI prediction system may be busy.',
        status: 'NETWORK_ERROR'
      };
    } else {
      // Other error
      throw {
        ...error,
        message: 'An unexpected error occurred',
        status: 'UNKNOWN_ERROR'
      };
    }
  }
};

// Optional: Add a function to test the prediction endpoints
export const testPredictionEndpoints = async (userToken) => {
  const endpoints = [
    '/news/test-wrapper',
    '/news/minimal-test'
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`http://127.0.0.1:8000${endpoint}`, {
        headers: {
          Authorization: `Bearer ${userToken}`
        },
        timeout: 120000
      });
      results[endpoint] = { status: 'success', data: response.data };
    } catch (error) {
      results[endpoint] = { 
        status: 'error', 
        error: error.response?.data || error.message 
      };
    }
  }
  
  return results;
};