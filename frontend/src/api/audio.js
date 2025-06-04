import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/audio/';

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
