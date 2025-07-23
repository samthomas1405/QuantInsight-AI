import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/market-live';

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
  try {
    const response = await axios.get(`${API_URL}/followed`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000, // 10 second timeout
    });
    return response.data;
  } catch (error) {
    console.error('fetchLiveFollowedMarketData error:', error);
    throw error;
  }
};

export const fetchStockHistory = async (symbol) => {
  try {
    const res = await axios.get(`${API_URL}/history/${symbol}`, {
      timeout: 10000, // 10 second timeout
    });
    return res.data;
  } catch (error) {
    console.error('fetchStockHistory error for symbol', symbol, ':', error);
    throw error;
  }
};