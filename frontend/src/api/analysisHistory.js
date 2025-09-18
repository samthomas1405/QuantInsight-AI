import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Save analysis to database
export const saveAnalysisToDatabase = async (analysisData, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/analysis-history`,
      analysisData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving analysis:', error);
    throw error;
  }
};

// Get user's analysis history
export const fetchAnalysisHistory = async (token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/analysis-history`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    throw error;
  }
};

// Get specific analysis by ID
export const fetchAnalysisById = async (analysisId, token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/analysis-history/${analysisId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    throw error;
  }
};

// Delete analysis
export const deleteAnalysis = async (analysisId, token) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/analysis-history/${analysisId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting analysis:', error);
    throw error;
  }
};