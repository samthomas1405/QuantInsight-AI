import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const sendAIQuery = async (query, conversationHistory = []) => {
  try {
    const response = await api.post('/ai-assistant/', { 
      query,
      conversation_history: conversationHistory 
    });
    return response.data;
  } catch (error) {
    console.error('Error sending AI query:', error);
    throw error;
  }
}; 