import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaClipboardList } from 'react-icons/fa';

const Header = () => {
  const { user } = useAuth();

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

        {/* Right side - User info */}
        {user && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {user.firstName} {user.lastName}
            </span>
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-medium text-sm">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;