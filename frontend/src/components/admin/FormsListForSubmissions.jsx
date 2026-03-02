import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaEye, 
  FaClipboardList,
  FaSearch,
  FaFileExport,
  FaChartBar
} from 'react-icons/fa';
import { formAPI } from '../../api/form.api';
import { submissionAPI } from '../../api/submission.api';
import Button from '../common/Button';
import Input from '../common/Input';
import Loader from '../common/Loader';
import Alert from '../common/Alert';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const FormsListForSubmissions = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [submissionStats, setSubmissionStats] = useState({});

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      const params = { search, limit: 100 };
      const response = await formAPI.getForms(params);
      const formsData = response.data.forms;
      setForms(formsData);

      const stats = {};
      await Promise.all(
        formsData.map(async (form) => {
          try {
            const submissionsResponse =
              await submissionAPI.getFormSubmissions(form._id, { limit: 1 });

            stats[form._id] = {
              total: submissionsResponse.data.pagination?.totalSubmissions || 0,
              lastSubmission:
                submissionsResponse.data.submissions?.[0]?.submittedAt || null,
            };
          } catch {
            stats[form._id] = { total: 0, lastSubmission: null };
          }
        })
      );

      setSubmissionStats(stats);
      setError(null);
    } catch (err) {
      setError('Failed to load forms');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleExportAll = async (formId, formTitle, format = 'excel') => {
    try {
      toast.loading(`Exporting ${formTitle} submissions...`, { id: 'export' });

      const response = await submissionAPI.exportSubmissions(formId, format);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute(
        'download',
        `${formTitle.replace(/\s+/g, '_')}_submissions.${
          format === 'excel' ? 'xlsx' : 'csv'
        }`
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Export completed successfully', { id: 'export' });
    } catch {
      toast.error('Failed to export submissions', { id: 'export' });
    }
  };

  const handleSearch = (e) => setSearch(e.target.value);

  if (loading && forms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" text="Loading forms..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-1 sm:px-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Form Submissions
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Select a form to view its submissions
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="Search forms by title..."
              value={search}
              onChange={handleSearch}
              icon={FaSearch}
            />
          </div>
        </div>
      </div>

      {error && <Alert type="error" title="Error" message={error} />}

      {/* Forms */}
      {forms.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FaClipboardList className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No forms found
          </h3>
          <p className="text-sm text-gray-600">
            {search
              ? 'No forms match your search criteria'
              : 'There are no forms to display'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {forms.map((form) => (
            <div
              key={form._id}
              className="card hover:shadow-lg transition-shadow h-full"
            >
              <div className="card-body flex flex-col">
                
                {/* Top */}
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaClipboardList className="h-6 w-6 text-primary-600" />
                  </div>

                  <span
                    className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      form.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900 break-words">
                  {form.title}
                </h3>

                {/* Description */}
                {form.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {form.description}
                  </p>
                )}

                {/* Stats */}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Total Submissions:
                    </span>
                    <span className="font-medium text-gray-900">
                      {submissionStats[form._id]?.total || 0}
                    </span>
                  </div>

                  {submissionStats[form._id]?.lastSubmission && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Last Submission:
                      </span>
                      <span className="text-gray-900 text-right">
                        {formatDate(
                          submissionStats[form._id].lastSubmission,
                          'MMM DD, YYYY'
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link
                    to={`/admin/submissions/${form._id}`}
                    className="w-full"
                  >
                    <Button
                      variant="primary"
                      className="w-full"
                      icon={FaEye}
                    >
                      View Submissions
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    onClick={() =>
                      handleExportAll(form._id, form.title, 'excel')
                    }
                    title="Export to Excel"
                    icon={FaFileExport}
                    className="w-full sm:w-auto"
                  />
                </div>

                <div className="mt-3">
                  <Link to={`/admin/submissions/${form._id}/stats`}>
                    <Button
                      variant="outline"
                      className="w-full"
                      icon={FaChartBar}
                      size="sm"
                    >
                      View Statistics
                    </Button>
                  </Link>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormsListForSubmissions;