import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../common/Loader';
import toast from 'react-hot-toast';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { oauthLogin } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const refreshToken = params.get('refreshToken');
      const userStr = params.get('user');
      const error = params.get('error');

      if (error) {
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
        return;
      }

      if (token && refreshToken && userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr));
          
          // Store tokens and user in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update auth context
          oauthLogin(user, token, refreshToken);
          
          toast.success(`Welcome, ${user.firstName || user.email}!`);
          navigate('/');
        } catch (error) {
          console.error('OAuth callback error:', error);
          toast.error('Failed to process login');
          navigate('/login');
        }
      } else {
        toast.error('Invalid authentication response');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [location, navigate, oauthLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader size="lg" text="Completing authentication..." />
    </div>
  );
};

export default OAuthCallback;