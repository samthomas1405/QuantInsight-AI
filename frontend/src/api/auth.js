import axios from 'axios';

const API_URL = "http://localhost:8000";

export const registerUser = (userData) => {
  return axios.post(`${API_URL}/auth/register`, userData);
};

export const loginUser = (credentials) => {
  return axios.post(`${API_URL}/auth/login`, credentials);
};

export const fetchUserInfo = (token) => {
  return axios.get(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
