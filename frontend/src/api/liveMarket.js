import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/market-live';

// 🔁 Get live market data for followed stocks
export const fetchLiveFollowedMarketData = async (token) => {
  const response = await axios.get(`${API_URL}/followed`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const fetchStockHistory = async (symbol) => {
  const res = await axios.get(`${API_URL}/history/${symbol}`);
  return res.data;
};