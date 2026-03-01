import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API URL:', API_URL);
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// ================= REQUEST INTERCEPTOR =================
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE INTERCEPTOR =================
axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // ================= NETWORK ERRORS =================
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const { status } = error.response;

    // ================= HANDLE 401 (TOKEN EXPIRED) =================
    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/') // ❗️IMPORTANT FIX
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${token}`;

        return axiosInstance(originalRequest);

      } catch (refreshError) {
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        if (!window.location.pathname.includes('/login')) {
          window.location.replace('/login');
          toast.error('Session expired. Please login again.');
        }

        return Promise.reject(refreshError);
      }
    }

    // ================= OTHER ERRORS =================
    if (status !== 401) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'An error occurred';

      switch (status) {
        case 400:
          toast.error(errorMessage);
          break;
        case 403:
          toast.error('You do not have permission.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(errorMessage);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;