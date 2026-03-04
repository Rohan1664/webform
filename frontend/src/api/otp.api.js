import axiosInstance from './axios';

export const otpAPI = {
  // Send OTP for registration
  sendOTP: async (userData) => {
    const response = await axiosInstance.post('/otp/send-otp', userData);
    return response.data;
  },

  // Verify OTP and complete registration
  verifyOTP: async (email, otp) => {
    const response = await axiosInstance.post('/otp/verify-otp', { email, otp });
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email) => {
    const response = await axiosInstance.post('/otp/resend-otp', { email });
    return response.data;
  }
};