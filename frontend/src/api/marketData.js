import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/market-data/';

export const fetchMarketData = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const addMarketData = async (data) => {
  const response = await axios.post(API_URL, data);
  return response.data;
};
