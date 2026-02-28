import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FaArrowLeft,
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaTrash, 
  FaDownload,
  FaCalendar,
  FaFileExcel,
  FaFileCsv
} from 'react-icons/fa';
import { submissionAPI } from '../../api/submission.api';
import { formAPI } from '../../api/form.api';
import Input from '../common/Input';
import Button from '../common/Button';
import Loader from '../common/Loader';
import Alert from '../common/Alert';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const SubmissionsTable = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalSubmissions: 0,
    totalPages: 1,
  });

  // Export function with better error handling
  const handleExport = async (format = 'excel') => {
    if (!formId) {
      toast.error('Form ID is missing');
      return;
    }

    const toastId = toast.loading(`Preparing ${format.toUpperCase()} export...`);
    
    try {
      console.log(`Exporting ${format} for form:`, formId);
      
      const response = await submissionAPI.exportSubmissions(formId, format);
      
      // Check if we got data
      if (!response.data || response.data.size === 0) {
        throw new Error('No data received from server');
      }
      
      // Create filename
      const date = new Date();
      const timestamp = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
      const formTitle = form?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'submissions';
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      const filename = `${formTitle}_submissions_${timestamp}.${extension}`;
      
      console.log('Downloading file:', filename);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      toast.success(`${format.toUpperCase()} export completed successfully!`, { id: toastId });
    } catch (err) {
      console.error('Export error details:', err);
      
      let errorMessage = `Failed to export as ${format.toUpperCase()}`;
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Unauthorized. Please login again.';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to export.';
        } else if (err.response.status === 404) {
          errorMessage = 'Export endpoint not found.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage, { id: toastId });
    }
  };

  // Memoize fetchSubmissions
  const fetchSubmissions = useCallback(async () => {
    if (!formId) {
      setError('Form ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      };
      
      const response = await submissionAPI.getFormSubmissions(formId, params);
      setSubmissions(response.data.submissions || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 20,
        totalSubmissions: 0,
        totalPages: 1,
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load submissions');
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  }, [formId, pagination.page, pagination.limit, search, dateRange.startDate, dateRange.endDate]);

  // Memoize fetchFormData
  const fetchFormData = useCallback(async () => {
    if (!formId) return;
    
    try {
      const response = await formAPI.getFormById(formId);
      setForm(response.data.form);
    } catch (err) {
      console.error('Error fetching form:', err);
    }
  }, [formId]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleDelete = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) {
      return;
    }

    try {
      await submissionAPI.deleteSubmission(submissionId);
      toast.success('Submission deleted successfully');
      fetchSubmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete submission');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDateChange = (type, value) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setSearch('');
    setDateRange({ startDate: '', endDate: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (!formId) {
    return (
      <div className="text-center py-12">
        <Alert type="error" title="Error" message="Form ID is required" />
        <div className="mt-4">
          <Button variant="primary" onClick={() => navigate('/admin/submissions')}>
            Back to Forms
          </Button>
        </div>
      </div>
    );
  }

  if (loading && submissions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" text="Loading submissions..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            icon={FaArrowLeft}
            onClick={() => navigate('/admin/submissions')}
          >
            Back to Forms
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {form?.title || 'Form'} Submissions
            </h1>
            <p className="mt-2 text-gray-600">
              {form?.description || 'View and manage form submissions'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            icon={FaFileCsv} 
            onClick={() => handleExport('csv')}
            disabled={submissions.length === 0}
          >
            CSV
          </Button>
          <Button 
            variant="outline" 
            icon={FaFileExcel} 
            onClick={() => handleExport('excel')}
            disabled={submissions.length === 0}
          >
            Excel
          </Button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search submissions..."
                value={search}
                onChange={handleSearch}
                icon={FaSearch}
              />
            </div>
            
            <div>
              <Input
                label="From Date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                icon={FaCalendar}
              />
            </div>
            
            <div>
              <Input
                label="To Date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                icon={FaCalendar}
              />
            </div>
          </div>
          
          {(search || dateRange.startDate || dateRange.endDate) && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                icon={FaFilter}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && <Alert type="error" title="Error" message={error} />}

      {/* Submissions table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Submitted By</th>
                <th className="table-header-cell">Submission Date</th>
                <th className="table-header-cell">Files</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FaEye className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        No submissions found
                      </p>
                      <p className="text-sm text-gray-600">
                        {search || dateRange.startDate || dateRange.endDate
                          ? 'No submissions match your filters'
                          : 'This form has no submissions yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map((submission) => (
                  <tr key={submission._id} className="table-row hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center">
                        {submission.submittedBy ? (
                          <>
                            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-medium">
                                {submission.submittedBy.firstName?.[0]}{submission.submittedBy.lastName?.[0]}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">
                                {submission.submittedBy.firstName} {submission.submittedBy.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {submission.submittedBy.email}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500">Anonymous User</div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {formatDate(submission.submittedAt, 'MMM DD, YYYY HH:mm')}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-1">
                        {submission.files?.map((file, index) => (
                          <a
                            key={index}
                            href={`${process.env.REACT_APP_UPLOADS_URL}/${file.fileName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            <FaDownload className="h-3 w-3 mr-1" />
                            {file.originalName}
                          </a>
                        ))}
                        {(!submission.files || submission.files.length === 0) && (
                          <span className="text-gray-400 text-sm">No files</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                        submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {submission.status || 'pending'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <Link to={`/admin/submissions/${formId}/view/${submission._id}`}>
                          <button
                            className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                            title="View Details"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(submission._id)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50"
                          title="Delete"
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
                  {Math.min(pagination.page * pagination.limit, pagination.totalSubmissions)}
                </span>{' '}
                of <span className="font-medium">{pagination.totalSubmissions}</span> submissions
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
    </div>
  );
};

export default SubmissionsTable;