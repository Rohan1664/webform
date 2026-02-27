import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaClipboardList,
  FaFileUpload,
  FaChartLine,
  FaUserPlus,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  // FaEye,
  FaDownload,
  FaSync
} from 'react-icons/fa';
import { adminAPI } from '../../api/admin.api';
import Loader from '../common/Loader';
import Alert from '../common/Alert';
import Button from '../common/Button';
// import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardStats();
      console.log('Dashboard API Response:', response); // Debug log

      if (response.success && response.data) {
        setDashboardData(response.data);
        setError(null);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics. Please try again.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Safely access nested data - CORRECTED STRUCTURE
  const stats = dashboardData?.stats || {};
  const charts = dashboardData?.charts || {};

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      icon: FaUsers,
      color: 'bg-blue-500',
      trend: '+0%',
      trendUp: true,
      onClick: () => navigate('/admin/users')
    },
    {
      title: 'Total Forms',
      value: stats.totalForms || 0,
      icon: FaClipboardList,
      color: 'bg-green-500',
      trend: '+0%',
      trendUp: true,
      onClick: () => navigate('/admin/forms')
    },
    {
      title: 'Total Submissions',
      value: stats.totalSubmissions || 0,
      icon: FaFileUpload,
      color: 'bg-purple-500',
      trend: '+0%',
      trendUp: true,
      onClick: () => navigate('/admin/submissions')
    },
    {
      title: 'Recent Submissions',
      value: stats.recentSubmissions || 0,
      icon: FaChartLine,
      color: 'bg-orange-500',
      trend: 'Last 7 days',
      trendUp: true,
      onClick: () => navigate('/admin/submissions?period=week')
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] w-full">
        <Loader size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-6">
        <Alert
          type="error"
          title="Error Loading Dashboard"
          message={error}
          onClose={() => setError(null)}
        />
        <div className="mt-4 flex justify-center">
          <Button
            variant="primary"
            onClick={fetchDashboardStats}
            icon={FaSync}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-h-[4rem] overflow-x-hidden">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here's what's happening with your forms today.
          </p>
        </div>
        <Button
          variant="primary"
          icon={FaUserPlus}
          onClick={() => navigate('/admin/users?action=add')}
        >
          Add New User
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="card hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
            onClick={stat.onClick}
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {stat.trendUp ? (
                      <FaArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <FaArrowDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forms by month chart */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Forms Created</h3>
              <p className="text-sm text-gray-500">Last 6 months</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/forms')}
            >
              View All Forms
            </Button>
          </div>
          <div className="card-body">
            {charts.formsByMonth?.length > 0 ? (
              <div className="space-y-4">
                {charts.formsByMonth.map((item, index) => {
                  const maxCount = Math.max(...charts.formsByMonth.map(i => i.count));
                  const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                  return (
                    <div key={index} className="flex items-center group">
                      <div className="w-24 text-sm text-gray-600">
                        {item._id.month}/{item._id.year}
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="relative">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-primary-600 h-2.5 rounded-full transition-all duration-500 ease-out group-hover:bg-primary-700"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="w-16 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FaChartLine className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500">No form data available</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/admin/forms/new')}
                >
                  <FaPlus className="h-4 w-4 mr-2" />
                  Create Your First Form
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* System Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">System Overview</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaUsers className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Total Users</p>
                    <p className="text-xs text-gray-500">Including admins</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
                  <p className="text-xs text-gray-500">Admins: {stats.totalAdmins || 0}</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FaClipboardList className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Active Forms</p>
                    <p className="text-xs text-gray-500">Currently active</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalForms || 0}</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <FaFileUpload className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Total Submissions</p>
                    <p className="text-xs text-gray-500">Across all forms</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions || 0}</p>
                  <p className="text-xs text-green-600">+{stats.recentSubmissions || 0} this week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/forms/new')}
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
            >
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-200">
                <FaPlus className="h-6 w-6 text-primary-600" />
              </div>
              <span className="font-medium text-gray-900 group-hover:text-primary-700">Create Form</span>
              <span className="text-sm text-gray-500 mt-1">Design a new form</span>
            </button>

            <button
              onClick={() => navigate('/admin/users')}
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200">
                <FaUsers className="h-6 w-6 text-blue-600" />
              </div>
              <span className="font-medium text-gray-900 group-hover:text-blue-700">Manage Users</span>
              <span className="text-sm text-gray-500 mt-1">View and manage users</span>
            </button>

            <button
              onClick={() => navigate('/admin/submissions')}
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-200">
                <FaDownload className="h-6 w-6 text-purple-600" />
              </div>
              <span className="font-medium text-gray-900 group-hover:text-purple-700">View Submissions</span>
              <span className="text-sm text-gray-500 mt-1">Check form responses</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">System Status: </span>
            <span className="text-sm font-medium text-green-600">All systems operational</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDashboardStats}
              icon={FaSync}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;