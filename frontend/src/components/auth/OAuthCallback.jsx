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
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const refreshToken = params.get('refreshToken');
        const userStr = params.get('user');
        const error = params.get('error');

        console.log('OAuth callback params:', { 
          token: !!token, 
          refreshToken: !!refreshToken, 
          userStr: !!userStr, 
          error 
        });

        if (error) {
          toast.error('Authentication failed. Please try again.');
          navigate('/login');
          return;
        }

        if (token && refreshToken && userStr) {
          try {
            const user = JSON.parse(decodeURIComponent(userStr));
            
            console.log('OAuth user data:', user);
            
            // Store tokens and user in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update auth context
            if (oauthLogin && typeof oauthLogin === 'function') {
              oauthLogin(user, token, refreshToken);
              toast.success(`Welcome, ${user.firstName || user.email}!`);
              navigate('/');
            } else {
              console.error('oauthLogin is not a function');
              // Fallback to page reload
              window.location.href = '/';
            }
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            toast.error('Failed to process login data');
            navigate('/login');
          }
        } else {
          toast.error('Invalid authentication response');
          navigate('/login');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        toast.error('Authentication failed');
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