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
  FaToggleOff
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
      await formAPI.updateForm(formId, { isActive: !currentStatus });
      toast.success(`Form ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchForms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update form status');
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Forms Management</h1>
          <p className="mt-2 text-gray-600">
            Create and manage all your forms
          </p>
        </div>
        <Link to="/admin/forms/new">
          <Button variant="primary" icon={FaPlus}>
            Create New Form
          </Button>
        </Link>
      </div>

      {/* Search and filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div className="flex-1 md:max-w-md">
              <Input
                placeholder="Search forms by title..."
                value={search}
                onChange={handleSearch}
                icon={FaSearch}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Status:</span>
                <div className="flex space-x-2">
                  <Button
                    variant={filter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'active' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('active')}
                  >
                    Active
                  </Button>
                  <Button
                    variant={filter === 'inactive' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('inactive')}
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

      {/* Forms table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Form Details</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Submissions</th>
                <th className="table-header-cell">Created</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
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
                  <tr key={form._id} className="table-row hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <FaClipboardList className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {form.title}
                          </div>
                          {form.description && (
                            <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                              {form.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        form.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {form.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
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
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {formatDate(form.createdAt, 'MMM DD, YYYY')}
                      </div>
                      <div className="text-xs text-gray-500">
                        by {form.createdBy?.firstName} {form.createdBy?.lastName}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleStatus(form._id, form.isActive)}
                          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
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
                            className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                            title="Edit Form"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                        </Link>
                        
                        <Link to={`/admin/submissions/${form._id}`}>
                          <button
                            className="p-2 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-50"
                            title="View Submissions"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                        </Link>
                        
                        <button
                          onClick={() => handleDeleteForm(form._id, form.title)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50"
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="card-footer">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.totalForms)}
                </span>{' '}
                of <span className="font-medium">{pagination.totalForms}</span> forms
              </div>
              <div className="flex space-x-2">
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

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Forms</p>
                <p className="text-3xl font-bold">{pagination.totalForms}</p>
              </div>
              <FaClipboardList className="h-10 w-10 text-blue-200" />
            </div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Forms</p>
                <p className="text-3xl font-bold">
                  {forms.filter(f => f.isActive).length}
                </p>
              </div>
              <FaToggleOn className="h-10 w-10 text-green-200" />
            </div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Submissions</p>
                <p className="text-3xl font-bold">
                  {forms.reduce((sum, form) => sum + (form.stats?.totalSubmissions || 0), 0)}
                </p>
              </div>
              <FaEye className="h-10 w-10 text-purple-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormsList;