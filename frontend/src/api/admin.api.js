import axiosInstance from './axios';

export const adminAPI = {
  // Get all users
  getUsers: async (params = {}) => {
    const response = await axiosInstance.get('/admin/users', { params });
    return response.data;
  },

  // Update user status
  updateUserStatus: async (userId, isActive) => {
    const response = await axiosInstance.patch(`/admin/users/${userId}/status`, { isActive });
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await axiosInstance.get('/admin/dashboard/stats');
    return response.data;
  },

  // Download submissions as Excel
  downloadExcel: async (formId) => {
    const response = await axiosInstance.get(`/admin/forms/${formId}/submissions/download/excel`, {
      responseType: 'blob',
    });
    return response; // Return full response, not just data
  },

  // Download submissions as CSV
  downloadCSV: async (formId) => {
    const response = await axiosInstance.get(`/admin/forms/${formId}/submissions/download/csv`, {
      responseType: 'blob',
    });
    return response; // Return full response, not just data
  },

  // Export users to Excel
  exportUsersToExcel: async (params = {}) => {
    const response = await axiosInstance.get('/admin/users/export/excel', {
      params,
      responseType: 'blob',
    });
    return response; // Return full response, not just data
  },

  // Export users to CSV
  exportUsersToCSV: async (params = {}) => {
    const response = await axiosInstance.get('/admin/users/export/csv', {
      params,
      responseType: 'blob',
    });
    return response; // Return full response, not just data
  }
};