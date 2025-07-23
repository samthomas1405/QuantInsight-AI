import axios from 'axios';

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