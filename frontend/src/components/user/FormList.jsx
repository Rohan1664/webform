import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaClipboardList, 
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
  const [filter, setFilter] = useState('all');
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
      let filteredForms = response.data.forms;
      
      if (filter === 'available') {
        filteredForms = filteredForms.filter(form => 
          form.isActive &&
          (!form.settings?.startDate || new Date(form.settings.startDate) <= new Date()) &&
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, filter]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (requiresLogin && !isAuthenticated()) {
      toast.error('Please login or sign up to fill this form');
      navigate('/login', { state: { from: { pathname: `/forms/${formId}` } } });
      return;
    }
    navigate(`/forms/${formId}`);
  };

  const isFormAvailable = (form) => {
    if (!form.isActive) return false;
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
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <Loader size="lg" text="Loading forms..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Available Forms
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Browse and submit available forms
        </p>
      </div>

      {/* Search & Filters */}
      <div className="card">
        <div className="card-body p-4 sm:p-6 space-y-4">
          
          <Input
            placeholder="Search forms..."
            value={search}
            onChange={handleSearch}
            icon={FaSearch}
          />

          <div className="grid grid-cols-3 sm:flex gap-2">
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

      {error && <Alert type="error" title="Error" message={error} />}

      {/* Forms Grid */}
      {forms.length === 0 ? (
        <div className="text-center py-12">
          <FaClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-600">No forms available</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {forms.map((form) => {
              const status = getFormStatus(form);
              const isAvailable = isFormAvailable(form);
              const requiresLogin = form.settings?.requireLogin !== false;

              return (
                <div
                  key={form._id}
                  className={`card hover:shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer ${
                    !isAvailable ? 'opacity-75' : ''
                  }`}
                  onClick={() => isAvailable && handleFormClick(form._id, requiresLogin)}
                >
                  <div className="card-body p-5 flex flex-col h-full">

                    <div className="flex justify-between items-start">
                      <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <FaClipboardList className="h-6 w-6 text-primary-600" />
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <h3 className="mt-4 text-sm sm:text-lg font-semibold text-gray-900 line-clamp-2 leading-snug">
                      {form.title}
                    </h3>

                    {form.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {form.description}
                      </p>
                    )}

                    <div className="mt-3 text-xs text-gray-500 space-y-1">
                      {form.settings?.startDate && (
                        <div>Starts: {formatDate(form.settings.startDate, 'MMM DD, YYYY')}</div>
                      )}
                      {form.settings?.endDate && (
                        <div>Ends: {formatDate(form.settings.endDate, 'MMM DD, YYYY')}</div>
                      )}
                    </div>

                    <div className="flex-grow" />

                    <button
                      className={`w-full mt-4 flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
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

                  </div>
                </div>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>

              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from({ length: pagination.totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={pagination.page === i + 1 ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>

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