import API_BASE_URL from './config';

import axios from 'axios';

const API_URL = `${API_BASE_URL}/audio/`;

export const transcribeAudio = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};
