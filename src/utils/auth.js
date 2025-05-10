/**
 * Authentication utilities for consistent token handling across the application
 */

/**
 * Gets the authentication token from localStorage with error handling
 * @returns {Object} Object containing token and any error message
 */
export const getAuthToken = () => {
  try {
    const userData = localStorage.getItem('userData');
    
    if (!userData) {
      return { token: null, error: 'Please login to access this resource' };
    }
    
    const parsedData = JSON.parse(userData);
    const token = parsedData?.token;
    
    if (!token) {
      return { token: null, error: 'Authentication token is missing' };
    }
    
    return { token, error: null };
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return { token: null, error: 'Authentication error occurred' };
  }
};

/**
 * Adds authentication headers to fetch options
 * @param {Object} options - Existing fetch options
 * @returns {Object} Updated fetch options with auth headers
 */
export const withAuth = (options = {}) => {
  const { token, error } = getAuthToken();
  
  if (error) {
    throw new Error(error);
  }
  
  return {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': options.headers?.['Content-Type'] || 'application/json',
    }
  };
};

/**
 * Makes an authenticated API request
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
export const authFetch = async (url, options = {}) => {
  const authOptions = withAuth(options);
  
  try {
    const response = await fetch(url, authOptions);
    
    if (!response.ok) {
      // Handle common auth errors
      if (response.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
