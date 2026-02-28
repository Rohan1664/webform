import axios from 'axios';
import toast from 'react-hot-toast';

// Use the environment variable or fallback to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Log the API URL in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API URL:', API_URL);
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased timeout for serverless functions (30 seconds)
  withCredentials: true, // Important for cookies if you're using them
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log all requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        params: config.params,
        data: config.data,
        headers: {
          ...config.headers,
          Authorization: token ? 'Bearer [HIDDEN]' : undefined
        }
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Log all responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    // Log all errors
    console.error('❌ Response error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });

    const originalRequest = error.config;

    // Handle network errors (no response from server)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please try again.');
      } else if (error.message === 'Network Error') {
        toast.error('Cannot connect to server. Please check if backend is running.');
      } else {
        toast.error('Network error. Please check your connection.');
      }
      return Promise.reject(error);
    }

    // Handle token expiration (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Don't try to refresh token on login page or auth endpoints
      if (originalRequest.url?.includes('/auth/login') || 
          originalRequest.url?.includes('/auth/register')) {
        return Promise.reject(error);
      }
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        console.log('🔄 Attempting to refresh token...');
        
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        console.log('✅ Token refreshed successfully');
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Clear storage and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other HTTP errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Don't show toast for 401 as we handle it above
      if (status !== 401) {
        const errorMessage = data?.message || data?.error || 'An error occurred';
        
        switch (status) {
          case 400:
            if (data?.errors) {
              data.errors.forEach(err => toast.error(err.msg || err));
            } else {
              toast.error(errorMessage);
            }
            break;
          case 403:
            toast.error('You do not have permission to perform this action');
            break;
          case 404:
            toast.error('Resource not found');
            break;
          case 500:
            toast.error('Server error occurred. Please try again later.');
            break;
          default:
            toast.error(errorMessage);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;