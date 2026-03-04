import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// Remove useAuth since it's not used
// import { useAuth } from '../../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { AiFillGithub } from 'react-icons/ai';
import Input from '../common/Input';
import Button from '../common/Button';
import Loader from '../common/Loader';
import OTPVerification from './OTPVerification';
import { validateEmail, validatePassword } from '../../utils/validators';
import { otpAPI } from '../../api/otp.api';
import toast from 'react-hot-toast';

const Register = () => {
  const [step, setStep] = useState('register'); // 'register' or 'verify'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    
    if (name === 'password' && errors.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters with uppercase, lowercase, and number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };
      
      await otpAPI.sendOTP(userData);
      setStep('verify');
      toast.success('OTP sent to your email!');
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToRegister = () => {
    setStep('register');
  };

  const handleGoogleLogin = () => {
    const backendUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleGitHubLogin = () => {
    const backendUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
    window.location.href = `${backendUrl}/api/auth/github`;
  };

  // If in verification step, show OTP component
  if (step === 'verify') {
    return (
      <OTPVerification 
        userData={{ email: formData.email }}
        onBack={handleBackToRegister}
      />
    );
  }

  // Registration form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="text-center px-2">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">DF</span>
          </div>
          <h2 className="mt-5 text-2xl sm:text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join us to start filling out forms
          </p>
        </div>
        
        {/* Card */}
        <div className="card w-full">
          <div className="card-body p-5 sm:p-6">
            
            <form className="space-y-5 sm:space-y-6" onSubmit={handleSendOTP}>
              
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First name"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  icon={FaUser}
                  placeholder="John"
                  required
                  autoComplete="given-name"
                />
                
                <Input
                  label="Last name"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  icon={FaUser}
                  placeholder="Doe"
                  required
                  autoComplete="family-name"
                />
              </div>
              
              <Input
                label="Email address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={FaEnvelope}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
              
              {/* Password field with show/hide */}
              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  icon={FaLock}
                  placeholder="••••••••"
                  required
                  helperText="Minimum 6 characters with uppercase, lowercase, and number"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex="-1"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
              
              {/* Confirm Password field with show/hide */}
              <div className="relative">
                <Input
                  label="Confirm password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  icon={FaLock}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
              
              {/* Terms */}
              <div className="flex items-start space-x-2">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="text-sm text-gray-900 leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full"
              >
                Continue
              </Button>
              
              {isLoading && (
                <div className="text-center">
                  <Loader size="sm" text="Sending OTP..." />
                </div>
              )}
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>
              
              {/* OAuth Buttons */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <FcGoogle className="h-5 w-5" />
                  Google
                </button>
                <button
                  type="button"
                  onClick={handleGitHubLogin}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <AiFillGithub className="h-5 w-5" />
                  GitHub
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center px-2">
          <p className="text-xs sm:text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;