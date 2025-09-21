import API_BASE_URL from './config';

import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const searchStocks = (query, token) => {
  return axios.get(`${API_URL}/user/stocks/search?q=${query}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const followStock = (symbol, token) => {
  return axios.post(`${API_URL}/user/stocks?symbol=${symbol}`, null, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const unfollowStock = (symbol, token) => {
  return axios.delete(`${API_URL}/user/stocks/${symbol}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const completeUserSetup = (token) => {
  return axios.post(`${API_URL}/auth/complete-setup`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
