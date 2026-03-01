import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaClipboardList, FaSignOutAlt, } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="h-full w-full bg-white border-b border-gray-200 flex items-center px-6">
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-sm">
            <FaClipboardList className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">
            Dynamic Forms
          </span>
        </Link>

        {/* Right side - User info with logout button */}
        {user ? (
          <div className="flex items-center space-x-4">
            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                <span className="text-sm text-gray-600 hidden md:block">
                  {user.firstName} {user.lastName}
                </span>
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center hover:bg-primary-200 transition-colors cursor-pointer">
                  <span className="text-primary-700 font-medium text-sm">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                </div>
              </button>

              {/* Dropdown menu */}
              {showDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                    {/* <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaUser className="mr-3 h-4 w-4 text-gray-500" />
                      Profile
                    </Link> */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                    >
                      <FaSignOutAlt className="mr-3 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;