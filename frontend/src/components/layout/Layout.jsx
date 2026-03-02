import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user, isAdmin } = useAuth();

  // Check if user is admin
  const userIsAdmin = user && isAdmin && isAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - fixed at top */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white z-50">
        <Header />
      </div>

      {/* Add padding top to account for fixed header */}
      <div className="pt-16">
        {user ? (
          // Logged in user layout
          <div className="flex">
            {/* Sidebar - Only render if user is admin */}
            {userIsAdmin && (
              <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto z-40">
                <Sidebar />
              </aside>
            )}

            {/* Main Content - Adjust margin based on whether sidebar exists */}
            <main className={`flex-1 p-6 ${userIsAdmin ? 'ml-64' : 'ml-0'}`}>
              {children}
            </main>
          </div>
        ) : (
          // Not logged in user layout - centered content
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        )}
      </div>
    </div>
  );
};

export default Layout;