import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaClipboardList, 
  FaUser, 
  FaCalendar,
  FaFilter,
  FaCheckCircle,
  FaClock,
  FaLock,
  FaEye
} from 'react-icons/fa';
import { formAPI } from '../../api/form.api';
import Input from '../common/Input';
import Button from '../common/Button';
import Loader from '../common/Loader';
import Alert from '../common/Alert';
import { formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const FormList = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, closed
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalForms: 0,
    totalPages: 1,
  });

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        activeOnly: filter !== 'closed',
      };
      
      const response = await formAPI.getForms(params);
      
      // Get all forms - no filtering by login requirement
      // This ensures everyone sees all forms
      let filteredForms = response.data.forms;
      
      // Apply local filter based on UI selection
      if (filter === 'available') {
        filteredForms = filteredForms.filter(form => 
          form.isActive && (!form.settings?.startDate || new Date(form.settings.startDate) <= new Date()) &&
          (!form.settings?.endDate || new Date(form.settings.endDate) >= new Date())
        );
      } else if (filter === 'closed') {
        filteredForms = filteredForms.filter(form => !form.isActive);
      }
      
      setForms(filteredForms);
      setPagination({
        ...response.data.pagination,
        totalForms: filteredForms.length
      });
      setError(null);
    } catch (err) {
      setError('Failed to load forms');
      console.error('Error fetching forms:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, filter]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFormClick = (formId, requiresLogin) => {
    // If form requires login and user is not authenticated
    if (requiresLogin && !isAuthenticated()) {
      toast.error('Please login or sign up to fill this form');
      navigate('/login', { state: { from: { pathname: `/forms/${formId}` } } });
      return;
    }
    
    // If form requires login and user is authenticated, or form doesn't require login
    navigate(`/forms/${formId}`);
  };

  const isFormAvailable = (form) => {
    if (!form.isActive) return false;
    
    // Check date restrictions
    const now = new Date();
    if (form.settings?.startDate && new Date(form.settings.startDate) > now) return false;
    if (form.settings?.endDate && new Date(form.settings.endDate) < now) return false;
    
    return true;
  };

  const getFormStatus = (form) => {
    if (!form.isActive) return { label: 'Closed', color: 'bg-gray-100 text-gray-800' };
    
    const now = new Date();
    if (form.settings?.startDate && new Date(form.settings.startDate) > now) {
      return { label: 'Scheduled', color: 'bg-yellow-100 text-yellow-800' };
    }
    if (form.settings?.endDate && new Date(form.settings.endDate) < now) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    }
    
    return { label: 'Open', color: 'bg-green-100 text-green-800' };
  };

  if (loading && forms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" text="Loading forms..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Available Forms</h1>
          <p className="mt-2 text-gray-600">
            Browse and submit available forms
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div className="flex-1 md:max-w-md">
              <Input
                placeholder="Search forms by title or description..."
                value={search}
                onChange={handleSearch}
                icon={FaSearch}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaFilter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Filter:</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={filter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'available' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('available')}
                >
                  Available
                </Button>
                <Button
                  variant={filter === 'closed' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('closed')}
                >
                  Closed
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <Alert type="error" title="Error" message={error} />}

      {/* Info banner for non-logged in users */}
      {!isAuthenticated() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <FaLock className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-700">
                <span className="font-medium">Note:</span> You can browse all forms, but you'll need to{' '}
                <Link to="/login" className="font-medium underline hover:text-blue-900">
                  login
                </Link>{' '}
                or{' '}
                <Link to="/register" className="font-medium underline hover:text-blue-900">
                  sign up
                </Link>{' '}
                to submit them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Forms grid */}
      {forms.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FaClipboardList className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No forms available
          </h3>
          <p className="text-gray-600">
            {search 
              ? 'No forms match your search criteria' 
              : filter === 'available' 
                ? 'There are no available forms at the moment'
                : 'There are no forms to display'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => {
              const status = getFormStatus(form);
              const isAvailable = isFormAvailable(form);
              const requiresLogin = form.settings?.requireLogin !== false; // Default to true if not specified
              
              return (
                <div 
                  key={form._id} 
                  className={`card hover:shadow-lg transition-shadow cursor-pointer ${
                    !isAvailable ? 'opacity-75' : ''
                  }`}
                  onClick={() => isAvailable && handleFormClick(form._id, requiresLogin)}
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FaClipboardList className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label === 'Open' && <FaCheckCircle className="mr-1 h-3 w-3" />}
                          {status.label === 'Scheduled' && <FaClock className="mr-1 h-3 w-3" />}
                          {status.label}
                        </span>
                        {requiresLogin && !isAuthenticated() && isAvailable && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <FaLock className="mr-1 h-3 w-3" />
                            Login
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      {form.title}
                    </h3>
                    
                    {form.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {form.description}
                      </p>
                    )}
                    
                    <div className="mt-4 space-y-2">
                      {form.settings?.startDate && (
                        <div className="flex items-center text-xs text-gray-500">
                          <FaCalendar className="mr-1 h-3 w-3" />
                          Starts: {formatDate(form.settings.startDate, 'MMM DD, YYYY')}
                        </div>
                      )}
                      
                      {form.settings?.endDate && (
                        <div className="flex items-center text-xs text-gray-500">
                          <FaCalendar className="mr-1 h-3 w-3" />
                          Ends: {formatDate(form.settings.endDate, 'MMM DD, YYYY')}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaUser className="h-4 w-4 mr-1" />
                        <span>{form.createdBy?.firstName} {form.createdBy?.lastName}</span>
                      </div>
                      <div className="flex items-center">
                        <FaCalendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(form.createdAt, 'MMM DD, YYYY')}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      {isAvailable ? (
                        <button
                          className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            requiresLogin && !isAuthenticated()
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFormClick(form._id, requiresLogin);
                          }}
                        >
                          {requiresLogin && !isAuthenticated() ? (
                            <>
                              <FaLock className="mr-2 h-4 w-4" />
                              Login to Fill
                            </>
                          ) : (
                            <>
                              <FaEye className="mr-2 h-4 w-4" />
                              Fill Form
                            </>
                          )}
                        </button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full cursor-not-allowed"
                          disabled
                        >
                          {!form.isActive ? 'Form Closed' : 
                           status.label === 'Scheduled' ? 'Not Started' : 
                           status.label === 'Expired' ? 'Expired' : 'Unavailable'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FormList;