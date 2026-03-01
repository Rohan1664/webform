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
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    
    // Clear API error when user starts typing
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
    setErrors({}); // Clear all previous errors
    
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
        // Set API error based on error type from AuthContext
        setApiErrorType(result.errorType || 'generic');
        setApiError(result.error || 'Login failed');
        
        // Don't set field errors for API errors - let the box handle it
        // This prevents duplicate error messages
      }
    } catch (error) {
      console.error('Login error:', error);
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth handlers
  const handleGoogleLogin = () => {
    const backendUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleGitHubLogin = () => {
    const backendUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
    window.location.href = `${backendUrl}/api/auth/github`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">DF</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>
        
        <div className="card">
          <div className="card-body">
            {/* Email not found error - shows as a blue info box */}
            {apiError && apiErrorType === 'email_not_found' && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex">
                  <FaExclamationCircle className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Account not found</p>
                    <p className="text-sm text-blue-700 mt-1">{apiError}</p>
                    <Link 
                      to="/register" 
                      className="text-sm font-medium text-primary-600 hover:text-primary-500 mt-2 inline-block"
                    >
                      Create a new account →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Invalid password error - shows as a yellow warning box */}
            {apiError && apiErrorType === 'invalid_password' && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <FaExclamationCircle className="text-yellow-500 mt-0.5 mr-3 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Incorrect password</p>
                    <p className="text-sm text-yellow-700 mt-1">{apiError}</p>
                    <Link 
                      to="/forgot-password" 
                      className="text-sm font-medium text-primary-600 hover:text-primary-500 mt-2 inline-block"
                    >
                      Forgot your password? →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Generic error - shows as a red error box */}
            {apiError && apiErrorType === 'generic' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{apiError}</p>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email} // Only shows validation errors, not API errors
                  icon={FaEnvelope}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              
              <div>
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password} // Only shows validation errors, not API errors
                  icon={FaLock}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <div className="flex items-center justify-end mt-2">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
              
              <div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  className="w-full"
                >
                  Sign in
                </Button>
              </div>
              
              {isLoading && (
                <div className="text-center">
                  <Loader size="sm" text="Signing in..." />
                </div>
              )}
            </form>
            
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
              
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Google
                </button>
                <button
                  type="button"
                  onClick={handleGitHubLogin}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  GitHub
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
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