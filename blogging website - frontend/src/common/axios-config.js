import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_DOMAIN,
  timeout: 30000, 
  withCredentials: false, 
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use(
  (config) => {
    console.log('Making request:', {
      url: config.url,
      method: config.method,
      headers: config.headers
    });
    
    const token = sessionStorage.getItem('user');
    if (token) {
      const parsedToken = JSON.parse(token).access_token;
      config.headers.Authorization = `Bearer ${parsedToken}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      toast.error('Network error - please check your connection');
      return Promise.reject(error);
    }

    if (!error.response) {
      toast.error('No response from server');
      return Promise.reject(error);
    }

    const message = error.response.data?.error || 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api; 