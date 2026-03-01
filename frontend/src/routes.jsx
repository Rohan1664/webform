import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import HomePage from './pages/HomePage';
import AdminPages from './pages/AdminPages';
import UserPages from './pages/UserPages';
import NotFound from './pages/NotFound';
import OAuthCallback from './components/auth/OAuthCallback';


// --------------------
// Protected Route
// --------------------
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};


// --------------------
// Public Only Route
// --------------------
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children;
};


// --------------------
// Home Redirect Logic
// --------------------
const HomeRedirect = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;

  // If Admin → redirect to /admin
  if (isAuthenticated() && isAdmin()) {
    return <Navigate to="/admin" replace />;
  }

  // Normal user or guest → HomePage
  return <HomePage />;
};


// --------------------
// Routes
// --------------------
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/oauth-callback" element={<OAuthCallback />} />

      {/* Home Route (Role Based) */}
      <Route
        path="/"
        element={
          <Layout>
            <HomeRedirect />
          </Layout>
        }
      />

      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      {/* Protected User Routes */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/forms/*"
          element={
            <Layout>
              <UserPages />
            </Layout>
          }
        />
        <Route
          path="/my-submissions"
          element={
            <Layout>
              <div>My Submissions</div>
            </Layout>
          }
        />
      </Route>

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute adminOnly />}>
        <Route
          path="/admin/*"
          element={
            <Layout>
              <AdminPages />
            </Layout>
          }
        />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <Layout>
            <NotFound />
          </Layout>
        }
      />

    </Routes>
  );
};

export default AppRoutes;