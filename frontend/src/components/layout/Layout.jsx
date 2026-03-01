import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user, isAdmin } = useAuth();

  // If user not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-16 px-6">
          {children}
        </div>
      </div>
    );
  }

  // Check if user is admin
  const userIsAdmin = isAdmin();

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-hidden">
      
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 z-50">
        <Header />
      </div>

      <div className="flex pt-16 h-full">

        {/* Sidebar - Only render if user is admin */}
        {userIsAdmin && (
          <aside className="w-64 bg-white border-r border-gray-200 fixed top-16 left-0 bottom-0 z-40">
            <Sidebar />
          </aside>
        )}

        {/* Main Content - Adjust margin based on whether sidebar exists */}
        <main className={`flex-1 overflow-y-auto p-6 ${userIsAdmin ? 'ml-64' : 'ml-0'}`}>
          {children}
        </main>

      </div>
    </div>
  );
};

export default Layout;