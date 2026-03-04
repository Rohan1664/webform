import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaClock } from 'react-icons/fa';
import Button from '../common/Button';
import { otpAPI } from '../../api/otp.api';
import toast from 'react-hot-toast';

const OTPVerification = ({ userData, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.split('');
    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });
    setOtp(newOtp);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await otpAPI.verifyOTP(userData.email, otpString);
      
      if (response.success) {
        // Store tokens and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        toast.success('Email verified successfully!');
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      await otpAPI.resendOTP(userData.email);
      setTimeLeft(600);
      setCanResend(false);
      toast.success('OTP resent successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="text-center px-2">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">DF</span>
          </div>
          <h2 className="mt-5 text-2xl sm:text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a 6-digit OTP to{' '}
            <span className="font-medium text-primary-600">{userData.email}</span>
          </p>
        </div>
        
        {/* Card */}
        <div className="card w-full">
          <div className="card-body p-5 sm:p-6">
            
            {/* Timer */}
            <div className="flex items-center justify-center gap-2 mb-6 text-sm">
              <FaClock className="text-gray-400" />
              <span className="text-gray-600">OTP expires in</span>
              <span className="font-medium text-primary-600">{formatTime(timeLeft)}</span>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            {/* OTP Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Enter 6-digit OTP
                </label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  ))}
                </div>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full"
              >
                Verify Email
              </Button>
            </form>
            
            {/* Resend option */}
            <div className="mt-4 text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Didn't receive OTP? Wait for timer to expire
                </p>
              )}
            </div>
            
            {/* Back button */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <FaArrowLeft className="mr-1 h-3 w-3" />
                Back to registration
              </button>
            </div>
          </div>
        </div>
        
        {/* Help text */}
        <div className="text-center px-2">
          <p className="text-xs text-gray-500">
            If you don't see the email, check your spam folder
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;