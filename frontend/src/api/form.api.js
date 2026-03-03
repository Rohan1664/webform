import axiosInstance from './axios';

export const formAPI = {
  // Get all forms
  getForms: async (params = {}) => {
    try {
      console.log('🔍 FormAPI.getForms called with params:', params);
      
      const response = await axiosInstance.get('/forms', { params });
      
      console.log('✅ FormAPI.getForms response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ FormAPI.getForms error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch forms'
      );
    }
  },

  // Get form by ID
  getFormById: async (formId) => {
    try {
      console.log(`🔍 FormAPI.getFormById called for ID: ${formId}`);
      
      const response = await axiosInstance.get(`/forms/${formId}`);
      
      console.log('✅ FormAPI.getFormById response:', {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ FormAPI.getFormById error for ID ${formId}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Throw a more specific error message
      const errorMessage = error.response?.data?.message || 
                          (error.response?.status === 404 ? 'Form not found' : 'Failed to fetch form');
      throw new Error(errorMessage);
    }
  },

  // Create form (admin only)
  createForm: async (formData) => {
    try {
      console.log('🔍 FormAPI.createForm called with data:', formData);
      
      const response = await axiosInstance.post('/forms', formData);
      
      console.log('✅ FormAPI.createForm response:', {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ FormAPI.createForm error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to create form'
      );
    }
  },

  // Update form (admin only)
  updateForm: async (formId, formData) => {
    try {
      console.log(`🔍 FormAPI.updateForm called for ID: ${formId} with data:`, formData);
      
      const response = await axiosInstance.put(`/forms/${formId}`, formData);
      
      console.log('✅ FormAPI.updateForm response:', {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ FormAPI.updateForm error for ID ${formId}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to update form'
      );
    }
  },

  // Toggle form status (admin only)
  toggleFormStatus: async (formId) => {
    try {
      console.log(`🔍 FormAPI.toggleFormStatus called for ID: ${formId}`);
      
      const response = await axiosInstance.patch(`/forms/${formId}/toggle-status`);
      
      console.log('✅ FormAPI.toggleFormStatus response:', {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ FormAPI.toggleFormStatus error for ID ${formId}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to toggle form status'
      );
    }
  },

  // Delete form (admin only) - PERMANENT DELETE
  deleteForm: async (formId) => {
    try {
      console.log(`🔍 FormAPI.deleteForm called for ID: ${formId}`);
      
      const response = await axiosInstance.delete(`/forms/${formId}`);
      
      console.log('✅ FormAPI.deleteForm response:', {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ FormAPI.deleteForm error for ID ${formId}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to delete form'
      );
    }
  }
};