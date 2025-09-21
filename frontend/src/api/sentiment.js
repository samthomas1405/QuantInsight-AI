import API_BASE_URL from './config';

import axios from 'axios';

const API_URL = `${API_BASE_URL}/sentiment/`;

export const analyzeSentiment = async (payload) => {
  try {
    // payload can be { text: "..." } or { url: "..." }
    const response = await axios.post(API_URL, payload);
    return response.data;
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw error;
  }
};
