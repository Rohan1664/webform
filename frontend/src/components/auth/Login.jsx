import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaEnvelope, FaLock, FaExclamationCircle } from 'react-icons/fa';
import Input from '../common/Input';
import Button from '../common/Button';
import Loader from '../common/Loader';
import { validateEmail } from '../../utils/validators';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [apiErrorType, setApiErrorType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

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
    
    if (apiError) {
      setApiError('');
      setApiErrorType('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setApiError('');
    setApiErrorType('');
    setErrors({});
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setApiErrorType(result.errorType || 'generic');
        setApiError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleGitHubLogin = () => {
    const backendUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
    window.location.href = `${backendUrl}/api/auth/github`;
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
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>
        
        {/* Card */}
        <div className="card w-full">
          <div className="card-body p-5 sm:p-6">
            
            {/* Email not found */}
            {apiError && apiErrorType === 'email_not_found' && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start">
                  <FaExclamationCircle className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" size={18} />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Account not found</p>
                    <p className="text-blue-700 mt-1">{apiError}</p>
                    <Link 
                      to="/register" 
                      className="font-medium text-primary-600 hover:text-primary-500 mt-2 inline-block"
                    >
                      Create a new account →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Invalid password */}
            {apiError && apiErrorType === 'invalid_password' && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <FaExclamationCircle className="text-yellow-500 mt-0.5 mr-3 flex-shrink-0" size={18} />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Incorrect password</p>
                    <p className="text-yellow-700 mt-1">{apiError}</p>
                    <Link 
                      to="/forgot-password" 
                      className="font-medium text-primary-600 hover:text-primary-500 mt-2 inline-block"
                    >
                      Forgot your password? →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Generic error */}
            {apiError && apiErrorType === 'generic' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{apiError}</p>
              </div>
            )}
            
            {/* Form */}
            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
              
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
              
              <div>
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  icon={FaLock}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <div className="flex justify-end mt-2">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full"
              >
                Sign in
              </Button>
              
              {isLoading && (
                <div className="text-center">
                  <Loader size="sm" text="Signing in..." />
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
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Google
                </button>
                <button
                  type="button"
                  onClick={handleGitHubLogin}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  GitHub
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center px-2">
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;