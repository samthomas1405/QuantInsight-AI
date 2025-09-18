import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const registerUser = (userData) => {
  return axios.post(`${API_URL}/auth/v2/register`, userData);
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

export const verifyRegistration = (email, code) => {
  return axios.post(`${API_URL}/auth/v2/verify-registration`, { email, code });
};

export const resendVerification = (email) => {
  return axios.post(`${API_URL}/auth/v2/resend-verification`, { email });
};

export const refreshToken = (token) => {
  return axios.post(`${API_URL}/auth/refresh`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const updateUserProfile = (token, profileData) => {
  return axios.put(`${API_URL}/auth/update-profile`, profileData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const changePassword = (token, passwordData) => {
  return axios.post(`${API_URL}/auth/change-password`, passwordData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
