import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * Fetch all sightings from the API
 * @returns {Promise<Array>} Array of sighting objects
 */
export const fetchSightings = async () => {
  try {
    const response = await axios.get(`${API_URL}/sightings`);
    // Backend returns {success: true, data: [...]}
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching sightings:', error);
    throw error;
  }
};

/**
 * Create a new sighting with image
 * @param {Object} sightingData - Form data containing sighting details
 * @returns {Promise<Object>} Created sighting response
 */
export const createSighting = async (sightingData) => {
  try {
    const formData = new FormData();

    // Append all sighting fields
    formData.append('latitude', sightingData.latitude);
    formData.append('longitude', sightingData.longitude);
    formData.append('status', sightingData.status);

    if (sightingData.mortality_type) {
      formData.append('mortality_type', sightingData.mortality_type);
    }

    if (sightingData.notes) {
      formData.append('notes', sightingData.notes);
    }

    // Append image file
    if (sightingData.image) {
      formData.append('image', sightingData.image);
    }

    const response = await axios.post(`${API_URL}/sightings`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error creating sighting:', error);
    throw error;
  }
};

/**
 * Check API health status
 */
export const checkHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};
