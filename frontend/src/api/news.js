import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/news/';

export const fetchNews = async (query = 'finance') => {
  try {
    const response = await axios.get(`${API_URL}?q=${query}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};
