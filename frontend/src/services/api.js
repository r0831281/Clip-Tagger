import axios from 'axios';

// Using relative URL will work both in development and in Docker with nginx
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Upload audio clips
export const uploadClips = async (formData, fileMetadata = [], onProgressUpdate = null) => {
  try {    // Add file metadata to the form data if provided
    if (fileMetadata && fileMetadata.length > 0) {
      formData.append('fileData', JSON.stringify(fileMetadata));
    }
    
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgressUpdate && progressEvent.total) {
          // Calculate the progress percentage
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgressUpdate(percentCompleted);
        }
      }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get all clips
export const getClips = async () => {
  try {
    const response = await api.get('/clips');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Update clip details
export const updateClip = async (clipId, clipData) => {
  try {
    const response = await api.put(`/clips/${clipId}`, clipData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Delete a clip
export const deleteClip = async (clipId) => {
  try {
    await api.delete(`/clips/${clipId}`);
    return true;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const errorMessage = error.response.data.error || 'Server error';
    console.error('API Error:', errorMessage, error.response.status);
    
    // Return customized error messages based on status codes
    switch (error.response.status) {
      case 404:
        return new Error('File not found on disk. It may have been moved or deleted.');
      case 409:
        return new Error('A file with that name already exists. Please choose a different name.');
      case 500:
        return new Error(errorMessage || 'Server error occurred while processing your request.');
      default:
        return new Error(errorMessage);
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API Request Error:', error.request);
    return new Error('No response from server. Please check your connection.');
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('API Setup Error:', error.message);
    return new Error('Error setting up request. Please try again.');
  }
};

export default api;
