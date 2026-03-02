import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaClipboardList,
  FaSearch,
  FaToggleOn,
  FaToggleOff,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { formAPI } from '../../api/form.api';
import Button from '../common/Button';
import Input from '../common/Input';
import Loader from '../common/Loader';
import Alert from '../common/Alert';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const FormsList = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
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
        activeOnly: filter === 'active' ? true : filter === 'inactive' ? false : undefined,
      };
      
      const response = await formAPI.getForms(params);
      setForms(response.data.forms);
      setPagination(response.data.pagination);
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

  const handleDeleteForm = async (formId, formTitle) => {
    if (!window.confirm(`Are you sure you want to delete the form "${formTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await formAPI.deleteForm(formId);
      toast.success('Form deleted successfully');
      fetchForms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete form');
    }
  };

  const handleToggleStatus = async (formId, currentStatus) => {
    try {
      await formAPI.toggleFormStatus(formId);
      
      toast.success(`Form ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchForms();
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error(err.response?.data?.message || 'Failed to update form status');
    }
  };

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
    setShowMobileFilters(false);
  };

  const toggleRowExpansion = (formId) => {
    setExpandedRows(prev => ({
      ...prev,
      [formId]: !prev[formId]
    }));
  };

  if (loading && forms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <Loader size="lg" text="Loading forms..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Forms Management</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Create and manage all your forms
          </p>
        </div>
        <Link to="/admin/forms/new" className="w-full sm:w-auto">
          <Button variant="primary" icon={FaPlus} className="w-full sm:w-auto justify-center">
            Create New Form
          </Button>
        </Link>
      </div>

      {/* Search and filters - Mobile optimized */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search bar */}
            <div className="w-full">
              <Input
                placeholder="Search forms by title..."
                value={search}
                onChange={handleSearch}
                icon={FaSearch}
                className="w-full"
              />
            </div>
            
            {/* Mobile filter toggle button */}
            <div className="sm:hidden">
              <Button
                variant="outline"
                className="w-full inline-flex items-center justify-center"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <FaSearch className="mr-2 h-4 w-4" />
                {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
            
            {/* Filter section */}
            <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('all')}
                    className="flex-1 sm:flex-none min-w-[80px]"
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'active' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('active')}
                    className="flex-1 sm:flex-none min-w-[80px]"
                  >
                    Active
                  </Button>
                  <Button
                    variant={filter === 'inactive' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('inactive')}
                    className="flex-1 sm:flex-none min-w-[80px]"
                  >
                    Inactive
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <Alert type="error" title="Error" message={error} />}

      {/* Forms table - Desktop view */}
      <div className="hidden sm:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forms.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FaClipboardList className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">No forms found</p>
                      <p className="text-sm text-gray-600 mb-4">
                        {search ? 'No forms match your search criteria' : 'Get started by creating your first form'}
                      </p>
                      {!search && (
                        <Link to="/admin/forms/new">
                          <Button variant="primary" size="sm">
                            Create Your First Form
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                forms.map((form) => (
                  <tr key={form._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FaClipboardList className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4 min-w-0 max-w-xs">
                          <div className="font-medium text-gray-900 truncate">
                            {form.title}
                          </div>
                          {form.description && (
                            <div className="text-sm text-gray-500 truncate">
                              {form.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        form.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {form.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">
                          {form.stats?.totalSubmissions || 0}
                        </span>
                        <span className="text-gray-500 ml-1">total</span>
                      </div>
                      {form.stats?.lastSubmissionAt && (
                        <div className="text-xs text-gray-500">
                          Last: {formatDate(form.stats.lastSubmissionAt, 'MMM DD')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(form.createdAt, 'MMM DD, YYYY')}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[120px]">
                        by {form.createdBy?.firstName} {form.createdBy?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleToggleStatus(form._id, form.isActive)}
                          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                          title={form.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {form.isActive ? (
                            <FaToggleOn className="h-5 w-5 text-green-600" />
                          ) : (
                            <FaToggleOff className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        
                        <Link to={`/admin/forms/edit/${form._id}`}>
                          <button
                            className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit Form"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                        </Link>
                        
                        <Link to={`/admin/submissions/${form._id}`}>
                          <button
                            className="p-2 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-50 transition-colors"
                            title="View Submissions"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                        </Link>
                        
                        <button
                          onClick={() => handleDeleteForm(form._id, form.title)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Form"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Desktop */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.totalForms)}
                </span>{' '}
                of <span className="font-medium">{pagination.totalForms}</span> forms
              </div>
              <div className="flex items-center space-x-2">
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
            </div>
          </div>
        )}
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden space-y-4">
        {forms.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-8 px-4">
            <div className="flex flex-col items-center">
              <FaClipboardList className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">No forms found</p>
              <p className="text-sm text-gray-600 mb-4">
                {search ? 'No forms match your search criteria' : 'Get started by creating your first form'}
              </p>
              {!search && (
                <Link to="/admin/forms/new" className="w-full">
                  <Button variant="primary" size="sm" className="w-full">
                    Create Your First Form
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          forms.map((form) => (
            <div key={form._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4">
                {/* Header with title and status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FaClipboardList className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{form.title}</h3>
                      {form.description && (
                        <p className="text-xs text-gray-500 truncate">{form.description}</p>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    form.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <span className="text-xs text-gray-500 block">Submissions</span>
                    <p className="text-sm font-medium text-gray-900">{form.stats?.totalSubmissions || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <span className="text-xs text-gray-500 block">Created</span>
                    <p className="text-sm font-medium text-gray-900">{formatDate(form.createdAt, 'MMM DD')}</p>
                  </div>
                </div>

                {/* Expandable details */}
                <button
                  onClick={() => toggleRowExpansion(form._id)}
                  className="w-full flex items-center justify-between text-xs text-gray-500 mb-2 hover:text-gray-700 transition-colors"
                >
                  <span>{expandedRows[form._id] ? 'Hide details' : 'Show details'}</span>
                  {expandedRows[form._id] ? <FaChevronUp className="h-3 w-3" /> : <FaChevronDown className="h-3 w-3" />}
                </button>

                {expandedRows[form._id] && (
                  <div className="mb-3 p-2 bg-gray-50 rounded-lg space-y-1">
                    {form.stats?.lastSubmissionAt && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Last submission:</span>
                        <span className="text-gray-900 font-medium">{formatDate(form.stats.lastSubmissionAt, 'MMM DD')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Created by:</span>
                      <span className="text-gray-900 font-medium truncate ml-2">
                        {form.createdBy?.firstName} {form.createdBy?.lastName}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleStatus(form._id, form.isActive)}
                    className={`inline-flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                      form.isActive 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {form.isActive ? (
                      <FaToggleOn className="h-5 w-5" />
                    ) : (
                      <FaToggleOff className="h-5 w-5" />
                    )}
                    <span className="text-xs font-medium">{form.isActive ? 'Active' : 'Inactive'}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <Link to={`/admin/forms/edit/${form._id}`}>
                      <button className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition-colors">
                        <FaEdit className="h-4 w-4" />
                      </button>
                    </Link>
                    
                    <Link to={`/admin/submissions/${form._id}`}>
                      <button className="p-2 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-50 transition-colors">
                        <FaEye className="h-4 w-4" />
                      </button>
                    </Link>
                    
                    <button
                      onClick={() => handleDeleteForm(form._id, form.title)}
                      className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col items-center space-y-3 py-4">
            <div className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="px-3"
              >
                Previous
              </Button>
              
              <div className="flex flex-wrap justify-center gap-1">
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
                      className="min-w-[36px] px-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick stats - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-blue-100 text-xs sm:text-sm truncate">Total Forms</p>
                <p className="text-xl sm:text-3xl font-bold text-white">{pagination.totalForms}</p>
              </div>
              <FaClipboardList className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-200 flex-shrink-0 ml-2" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-green-100 text-xs sm:text-sm truncate">Active Forms</p>
                <p className="text-xl sm:text-3xl font-bold text-white">
                  {forms.filter(f => f.isActive).length}
                </p>
              </div>
              <FaToggleOn className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-green-200 flex-shrink-0 ml-2" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-sm overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-purple-100 text-xs sm:text-sm truncate">Total Submissions</p>
                <p className="text-xl sm:text-3xl font-bold text-white">
                  {forms.reduce((sum, form) => sum + (form.stats?.totalSubmissions || 0), 0)}
                </p>
              </div>
              <FaEye className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-purple-200 flex-shrink-0 ml-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormsList;