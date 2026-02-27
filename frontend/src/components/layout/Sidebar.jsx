import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaChartBar,
  FaClipboardList,
  FaUsers,
  FaFileUpload,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: FaChartBar },
    { to: '/admin/forms', label: 'Forms', icon: FaClipboardList },
    { to: '/admin/submissions', label: 'Submissions', icon: FaFileUpload },
    { to: '/admin/users', label: 'Users', icon: FaUsers },
    { to: '/admin/settings', label: 'Settings', icon: FaCog },
  ];

  const links = isAdmin() ? adminLinks : [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* User Profile */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-semibold text-lg">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate capitalize flex items-center">
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
              {user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <link.icon className="h-5 w-5" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors group"
        >
          <FaSignOutAlt className="h-5 w-5 text-gray-500 group-hover:text-red-600" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;