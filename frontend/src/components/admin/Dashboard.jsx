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
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] w-full px-4">
        <Loader size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 sm:px-6">
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
            className="w-full sm:w-auto justify-center"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-h-screen overflow-x-hidden px-4 sm:px-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Dashboard</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 break-words">
            Welcome back! Here's what's happening with your forms today.
          </p>
        </div>
        <Button
          variant="primary"
          icon={FaUserPlus}
          onClick={() => navigate('/admin/users?action=add')}
          className="w-full sm:w-auto justify-center whitespace-nowrap"
        >
          Add New User
        </Button>
      </div>

      {/* Stats cards - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="card hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1 w-full"
            onClick={stat.onClick}
          >
            <div className="card-body p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                  <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold text-gray-900 break-words">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <div className="flex items-center mt-1 sm:mt-2 min-w-0">
                    {stat.trendUp ? (
                      <FaArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
                    ) : (
                      <FaArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1 flex-shrink-0" />
                    )}
                    <span className={`text-xs sm:text-sm truncate ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 rounded-lg shadow-lg flex-shrink-0`}>
                  <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts section - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Forms by month chart */}
        <div className="card w-full">
          <div className="card-header p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 break-words">Forms Created</h3>
              <p className="text-xs sm:text-sm text-gray-500">Last 6 months</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/forms')}
              className="w-full sm:w-auto justify-center whitespace-nowrap"
            >
              View All Forms
            </Button>
          </div>
          <div className="card-body p-4 sm:p-6 pt-0 sm:pt-0">
            {charts.formsByMonth?.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {charts.formsByMonth.map((item, index) => {
                  const maxCount = Math.max(...charts.formsByMonth.map(i => i.count));
                  const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                  return (
                    <div key={index} className="flex items-center group w-full">
                      <div className="w-20 sm:w-24 text-xs sm:text-sm text-gray-600 flex-shrink-0">
                        {item._id.month}/{item._id.year}
                      </div>
                      <div className="flex-1 mx-2 sm:mx-4 min-w-0">
                        <div className="relative w-full">
                          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
                            <div
                              className="bg-primary-600 h-2 sm:h-2.5 rounded-full transition-all duration-500 ease-out group-hover:bg-primary-700"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="w-12 sm:w-16 text-right flex-shrink-0">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <FaChartLine className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
                <p className="text-sm sm:text-base text-gray-500">No form data available</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 sm:mt-4 w-full sm:w-auto justify-center"
                  onClick={() => navigate('/admin/forms/new')}
                >
                  <FaPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Create Your First Form
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* System Overview */}
        <div className="card w-full">
          <div className="card-header p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 break-words">System Overview</h3>
          </div>
          <div className="card-body p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg w-full">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaUsers className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Total Users</p>
                    <p className="text-xs text-gray-500 truncate">Including admins</p>
                  </div>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
                  <p className="text-xs text-gray-500">Admins: {stats.totalAdmins || 0}</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg w-full">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Active Forms</p>
                    <p className="text-xs text-gray-500 truncate">Currently active</p>
                  </div>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalForms || 0}</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg w-full">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaFileUpload className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Total Submissions</p>
                    <p className="text-xs text-gray-500 truncate">Across all forms</p>
                  </div>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalSubmissions || 0}</p>
                  <p className="text-xs text-green-600 truncate">+{stats.recentSubmissions || 0} this week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions - Responsive grid */}
      <div className="card w-full">
        <div className="card-header p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 break-words">Quick Actions</h3>
        </div>
        <div className="card-body p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/admin/forms/new')}
              className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group w-full"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-primary-200">
                <FaPlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
              </div>
              <span className="text-sm sm:text-base font-medium text-gray-900 group-hover:text-primary-700 text-center break-words">Create Form</span>
              <span className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 text-center break-words">Design a new form</span>
            </button>

            <button
              onClick={() => navigate('/admin/users')}
              className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group w-full"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-blue-200">
                <FaUsers className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <span className="text-sm sm:text-base font-medium text-gray-900 group-hover:text-blue-700 text-center break-words">Manage Users</span>
              <span className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 text-center break-words">View and manage users</span>
            </button>

            <button
              onClick={() => navigate('/admin/submissions')}
              className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group w-full"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-purple-200">
                <FaDownload className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <span className="text-sm sm:text-base font-medium text-gray-900 group-hover:text-purple-700 text-center break-words">View Submissions</span>
              <span className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 text-center break-words">Check form responses</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status bar - Responsive */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">System Status:</span>
            <span className="text-xs sm:text-sm font-medium text-green-600 whitespace-nowrap">All systems operational</span>
          </div>
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <span className="text-xs text-gray-500 order-2 xs:order-1 text-center sm:text-left">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDashboardStats}
              icon={FaSync}
              className="w-full xs:w-auto justify-center order-1 xs:order-2 whitespace-nowrap"
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