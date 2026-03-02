import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user is admin
  const userIsAdmin = user && isAdmin && isAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header - fixed at top */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white z-50 shadow-sm">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Add padding top to account for fixed header */}
      <div className="pt-16">
        {user ? (
          <div className="flex">
            
            {/* ===== MOBILE OVERLAY ===== */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* ===== SIDEBAR ===== */}
            {userIsAdmin && (
              <aside
                className={`
                  fixed top-16 bottom-0 left-0 z-40
                  w-64 bg-white border-r border-gray-200 overflow-y-auto
                  transform transition-transform duration-300
                  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                  md:translate-x-0
                `}
              >
                <Sidebar />
              </aside>
            )}

            {/* ===== MAIN CONTENT ===== */}
            <main
              className={`
                flex-1 p-4 sm:p-6 transition-all duration-300
                ${userIsAdmin ? 'md:ml-64' : 'ml-0'}
              `}
            >
              {children}
            </main>
          </div>
        ) : (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        )}
      </div>
    </div>
  );
};

export default Layout;