import axiosInstance from './axios';

export const submissionAPI = {
  // Submit form response
  submitForm: async (formId, formData, files) => {
    if (!formId) {
      throw new Error('Form ID is required');
    }
    
    const formDataObj = new FormData();
    
    // Add form data
    Object.keys(formData).forEach(key => {
      if (Array.isArray(formData[key])) {
        formData[key].forEach(value => {
          formDataObj.append(key, value);
        });
      } else if (formData[key] !== null && formData[key] !== undefined) {
        formDataObj.append(key, formData[key]);
      }
    });
    
    // Add files
    if (files && files.length > 0) {
      files.forEach(file => {
        formDataObj.append('files', file);
      });
    }
    
    const response = await axiosInstance.post(`/submissions/${formId}`, formDataObj, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get form submissions (admin only)
  getFormSubmissions: async (formId, params = {}) => {
    if (!formId) {
      throw new Error('Form ID is required');
    }
    const response = await axiosInstance.get(`/submissions/form/${formId}`, { params });
    return response.data;
  },

  // Get submission by ID
  getSubmissionById: async (submissionId) => {
    if (!submissionId) {
      throw new Error('Submission ID is required');
    }
    const response = await axiosInstance.get(`/submissions/${submissionId}`);
    return response.data;
  },

  // Delete submission (admin only)
  deleteSubmission: async (submissionId) => {
    if (!submissionId) {
      throw new Error('Submission ID is required');
    }
    const response = await axiosInstance.delete(`/submissions/${submissionId}`);
    return response.data;
  },

  // Export submissions (admin only)
  exportSubmissions: async (formId, format = 'excel') => {
    if (!formId) {
      throw new Error('Form ID is required');
    }
    const response = await axiosInstance.get(
      `/admin/forms/${formId}/submissions/download/${format}`,
      { responseType: 'blob' }
    );
    return response;
  }
};