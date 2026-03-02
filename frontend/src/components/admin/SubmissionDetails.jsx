import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Remove Link since it's not used
import { submissionAPI } from '../../api/submission.api'; // Fix import path
import { formAPI } from '../../api/form.api'; // Fix import path
import { 
  FaArrowLeft, 
  FaUser, 
  FaCalendar, 
  FaEnvelope,
  FaDownload,
  FaFile,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaIdCard
} from 'react-icons/fa';
import Loader from '../common/Loader';
import Alert from '../common/Alert';
import Button from '../common/Button';
import { formatDate, formatFileSize } from '../../utils/helpers';
import toast from 'react-hot-toast';

const SubmissionDetails = () => {
  const { formId, submissionId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [form, setForm] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [processing, setProcessing] = useState(false);

  // Define fetchSubmissionDetails with useCallback
  const fetchSubmissionDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch submission details
      const submissionResponse = await submissionAPI.getSubmissionById(submissionId);
      const submissionData = submissionResponse.data;
      setSubmission(submissionData.submission);
      
      // Fetch form details
      const formResponse = await formAPI.getFormById(formId);
      setForm(formResponse.data.form);
      setFormFields(formResponse.data.fields);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching submission details:', err);
      setError('Failed to load submission details');
    } finally {
      setLoading(false);
    }
  }, [submissionId, formId]); // Add dependencies

  useEffect(() => {
    if (submissionId && formId) {
      fetchSubmissionDetails();
    }
  }, [fetchSubmissionDetails, submissionId, formId]); // Add dependencies

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessing(true);
      await submissionAPI.deleteSubmission(submissionId);
      toast.success('Submission deleted successfully');
      navigate(`/admin/submissions/${formId}`);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete submission');
    } finally {
      setProcessing(false);
    }
  };

  const getFieldValue = (fieldName) => {
    if (!submission || !submission.submissionData) return null;
    
    // Handle both Map and regular object
    if (submission.submissionData instanceof Map) {
      return submission.submissionData.get(fieldName);
    }
    return submission.submissionData[fieldName];
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FaCheckCircle className="mr-1 h-3 w-3" />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FaClock className="mr-1 h-3 w-3" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FaTimesCircle className="mr-1 h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const renderFieldValue = (field, value) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">Not provided</span>;
    }

    switch (field.fieldType) {
      case 'file':
        if (submission.files && submission.files.length > 0) {
          const file = submission.files.find(f => f.fieldName === field.name);
          if (file) {
            return (
              <a
                href={`${process.env.REACT_APP_UPLOADS_URL}/${file.fileName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FaDownload className="mr-2 h-4 w-4" />
                <span className="text-sm font-medium">{file.originalName}</span>
                <span className="ml-2 text-xs text-blue-500">
                  ({formatFileSize(file.fileSize)})
                </span>
              </a>
            );
          }
        }
        return <span className="text-gray-400 italic">No file uploaded</span>;

      case 'checkbox':
        if (Array.isArray(value)) {
          return value.length > 0 ? (
            <div className="space-y-1">
              {value.map((item, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-sm mr-1">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400 italic">None selected</span>
          );
        }
        return String(value);

      case 'radio':
      case 'dropdown':
        return <span className="font-medium">{value}</span>;

      case 'textarea':
        return (
          <div className="bg-gray-50 p-3 rounded-lg whitespace-pre-wrap text-sm">
            {value}
          </div>
        );

      default:
        return <span>{value}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" text="Loading submission details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert type="error" title="Error" message={error} />
        <div className="mt-4">
          <Button
            variant="outline"
            icon={FaArrowLeft}
            onClick={() => navigate(`/admin/submissions/${formId}`)}
          >
            Back to Submissions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            icon={FaArrowLeft}
            onClick={() => navigate(`/admin/submissions/${formId}`)}
          >
            Back to Submissions
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Submission Details
          </h1>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={processing}
          >
            Delete Submission
          </Button>
        </div>
      </div>

      {/* Form Info Card */}
      {form && (
        <div className="card">
          <div className="card-body">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {form.title}
            </h2>
            {form.description && (
              <p className="text-gray-600 mb-4">{form.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center">
                <FaIdCard className="mr-2" />
                Submission ID: {submission._id}
              </span>
              <span className="flex items-center">
                <FaCalendar className="mr-2" />
                Submitted: {formatDate(submission.submittedAt, 'MMMM DD, YYYY HH:mm')}
              </span>
              {submission.submittedBy && (
                <>
                  <span className="flex items-center">
                    <FaUser className="mr-2" />
                    By: {submission.submittedBy.firstName} {submission.submittedBy.lastName}
                  </span>
                  <span className="flex items-center">
                    <FaEnvelope className="mr-2" />
                    {submission.submittedBy.email}
                  </span>
                </>
              )}
              <span className="flex items-center">
                Status: {getStatusBadge(submission.status)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Submission Data */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Form Responses</h3>
        </div>
        <div className="card-body">
          <div className="space-y-6">
            {formFields.map((field, index) => {
              const value = getFieldValue(field.name);
              
              return (
                <div key={field._id || index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.validation?.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {field.fieldType}
                    </span>
                  </div>
                  <div className="mt-1 text-gray-900">
                    {renderFieldValue(field, value)}
                  </div>
                  {field.helpText && (
                    <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Files Section */}
      {submission.files && submission.files.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Attached Files</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submission.files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaFile className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.fileSize)} • {file.mimeType}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`${process.env.REACT_APP_UPLOADS_URL}/${file.fileName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <FaDownload className="h-5 w-5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionDetails;