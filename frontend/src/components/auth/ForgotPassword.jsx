import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { FaEnvelope, FaArrowLeft, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'; // Added missing icons
import Input from '../common/Input';
import Button from '../common/Button';
// Removed unused Loader and Alert imports
import axiosInstance from '../../api/axios';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('request'); // 'request', 'verify', 'reset'

  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await axiosInstance.post('/password/request-reset', { email });
      setStep('verify');
      toast.success('OTP sent to your email!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'request') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
          
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">DF</span>
            </div>
            <h2 className="mt-5 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Forgot Password?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email to receive a password reset OTP
            </p>
          </div>
          
          <div className="card">
            <div className="card-body p-5 sm:p-6">
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleRequestReset} className="space-y-6">
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={FaEnvelope}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
                
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  className="w-full"
                >
                  Send OTP
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  <FaArrowLeft className="mr-1 h-3 w-3" />
                  Back to login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return <VerifyOTP email={email} onVerified={() => setStep('reset')} />;
  }

  if (step === 'reset') {
    return <ResetPassword email={email} />;
  }
};

const VerifyOTP = ({ email, onVerified }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600);
  const [canResend, setCanResend] = useState(false);

  React.useEffect(() => {
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
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`reset-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`reset-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
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
      const response = await axiosInstance.post('/password/verify-otp', { 
        email, 
        otp: otpString 
      });
      
      // Store reset token temporarily
      localStorage.setItem('resetToken', response.data.data.resetToken);
      onVerified();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await axiosInstance.post('/password/request-reset', { email });
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md space-y-6">
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">DF</span>
          </div>
          <h2 className="mt-5 text-2xl font-bold text-gray-900">
            Verify OTP
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the 6-digit OTP sent to {email}
          </p>
        </div>
        
        <div className="card">
          <div className="card-body p-5">
            
            <div className="flex items-center justify-center gap-2 mb-6 text-sm">
              <span className="text-gray-600">OTP expires in</span>
              <span className="font-medium text-primary-600">{formatTime(timeLeft)}</span>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Enter OTP
                </label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`reset-otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
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
                Verify OTP
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              {canResend ? (
                <button
                  onClick={handleResend}
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
          </div>
        </div>
      </div>
    </div>
  );
};

const ResetPassword = ({ email }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validatePassword = (pass) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    return re.test(pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters with uppercase, lowercase, and number');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const resetToken = localStorage.getItem('resetToken');
      await axiosInstance.post('/password/reset-password', {
        resetToken,
        newPassword: password
      });
      
      localStorage.removeItem('resetToken');
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md space-y-6">
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">DF</span>
          </div>
          <h2 className="mt-5 text-2xl font-bold text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password for {email}
          </p>
        </div>
        
        <div className="card">
          <div className="card-body p-5">
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={FaLock}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
              
              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={FaLock}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full"
              >
                Reset Password
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;