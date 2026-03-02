import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submissionAPI } from '../../api/submission.api';
import { formAPI } from '../../api/form.api';
import { 
  FaArrowLeft, 
  FaCalendar, 
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

  const fetchSubmissionDetails = useCallback(async () => {
    try {
      setLoading(true);

      const submissionResponse = await submissionAPI.getSubmissionById(submissionId);
      const submissionData = submissionResponse.data;
      setSubmission(submissionData.submission);

      const formResponse = await formAPI.getFormById(formId);
      setForm(formResponse.data.form);
      setFormFields(formResponse.data.fields);

      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load submission details');
    } finally {
      setLoading(false);
    }
  }, [submissionId, formId]);

  useEffect(() => {
    if (submissionId && formId) {
      fetchSubmissionDetails();
    }
  }, [fetchSubmissionDetails, submissionId, formId]);

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
      toast.error(err.response?.data?.message || 'Failed to delete submission');
    } finally {
      setProcessing(false);
    }
  };

  const getFieldValue = (fieldName) => {
    if (!submission || !submission.submissionData) return null;
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
      case 'textarea':
        return (
          <div className="bg-gray-50 p-3 rounded-lg whitespace-pre-wrap text-sm">
            {value}
          </div>
        );
      default:
        return <span className="break-words">{value}</span>;
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
      <div className="max-w-4xl mx-auto px-4">
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
    <div className="space-y-6 px-1 sm:px-0">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button
            variant="outline"
            icon={FaArrowLeft}
            onClick={() => navigate(`/admin/submissions/${formId}`)}
          >
            Back
          </Button>

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Submission Details
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto">
            Print
          </Button>

          <Button
            variant="danger"
            onClick={handleDelete}
            loading={processing}
            className="w-full sm:w-auto"
          >
            Delete Submission
          </Button>
        </div>
      </div>

      {/* Form Info */}
      {form && submission && (
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {form.title}
            </h2>

            {form.description && (
              <p className="text-gray-600 mt-2">{form.description}</p>
            )}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
              <div className="flex items-center break-all">
                <FaIdCard className="mr-2" />
                {submission._id}
              </div>

              <div className="flex items-center">
                <FaCalendar className="mr-2" />
                {formatDate(submission.submittedAt, 'MMMM DD, YYYY HH:mm')}
              </div>

              <div>Status: {getStatusBadge(submission.status)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Form Responses */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Form Responses</h3>
        </div>

        <div className="card-body space-y-6">
          {formFields.map((field, index) => {
            const value = getFieldValue(field.name);

            return (
              <div key={field._id || index} className="border-b pb-4 last:border-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">
                    {field.fieldType}
                  </span>
                </div>

                <div className="text-gray-900 text-sm">
                  {renderFieldValue(field, value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Files */}
      {submission?.files?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Attached Files</h3>
          </div>

          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {submission.files.map((file, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaFile className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="break-all">
                      <p className="text-sm font-medium text-gray-900">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.fileSize)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`${process.env.REACT_APP_UPLOADS_URL}/${file.fileName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
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