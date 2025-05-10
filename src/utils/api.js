const API_BASE_URL = '/api';

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Indicates if the request was successful
 * @property {any} data - The response data
 * @property {string} [error] - Error message if the request failed
 */

/**
 * API utility for making HTTP requests
 */
export const api = {
  /**
   * Make a GET request
   * @param {string} endpoint - The API endpoint
   * @returns {Promise<ApiResponse>} - The response data
   */
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Make a POST request
   * @param {string} endpoint - The API endpoint
   * @param {any} data - The data to send
   * @returns {Promise<ApiResponse>} - The response data
   */
  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Make a PUT request
   * @param {string} endpoint - The API endpoint
   * @param {any} data - The data to send
   * @returns {Promise<ApiResponse>} - The response data
   */
  put: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Make a DELETE request
   * @param {string} endpoint - The API endpoint
   * @returns {Promise<ApiResponse>} - The response data
   */
  delete: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
}; 