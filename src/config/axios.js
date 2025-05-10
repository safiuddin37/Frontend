import axios from 'axios';

const API = axios.create({
  baseURL: 'https://mtc-backend-jn5y.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for authentication
API.interceptors.request.use(
  (config) => {
    // Get token from userData object
    const userDataStr = localStorage.getItem('userData');
    let token = null;
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        token = userData.token;
      } catch (e) {
        console.error('Failed to parse userData from localStorage', e);
      }
    }
    
    // Add token to headers if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      // Handle 403 Forbidden
      if (error.response.status === 403) {
        window.location.href = '/unauthorized';
      }
    }
    return Promise.reject(error);
  }
);

export default API;