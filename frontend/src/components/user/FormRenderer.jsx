import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaLock } from 'react-icons/fa';
import { formAPI } from '../../api/form.api';
import { submissionAPI } from '../../api/submission.api';
import DynamicForm from '../dynamic-form/DynamicForm';
import Loader from '../common/Loader';
import Alert from '../common/Alert';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const FormRenderer = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);

  const fetchForm = useCallback(async () => {
    try {
      setLoading(true);
      const response = await formAPI.getFormById(formId);

      setForm(response.data.form);
      setFields(response.data.fields);
      setRequiresLogin(response.data.form.settings?.requireLogin !== false);

      if (response.data.form.settings?.requireLogin && !isAuthenticated()) {
        setError('Please login to fill this form');
      } else {
        setError(null);
      }
    } catch (err) {
      setError('Failed to load form');
      console.error('Error fetching form:', err);
    } finally {
      setLoading(false);
    }
  }, [formId, isAuthenticated]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const handleSubmit = async (formData) => {
    if (requiresLogin && !isAuthenticated()) {
      toast.error('Please login to submit this form');
      navigate('/login', { state: { from: { pathname: `/forms/${formId}` } } });
      return;
    }

    try {
      const files = [];
      const dataToSend = { ...formData };

      fields.forEach(field => {
        if (field.fieldType === 'file' && formData[field.name] instanceof File) {
          files.push(formData[field.name]);
          dataToSend[field.name] = formData[field.name].name;
        }
      });

      await submissionAPI.submitForm(formId, dataToSend, files);
      setSubmitted(true);
      toast.success('Form submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit form');
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: { pathname: `/forms/${formId}` } } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Loader size="lg" text="Loading form..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Alert type="error" title="Error" message={error} />

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            icon={FaArrowLeft}
            onClick={() => navigate('/forms')}
            className="w-full sm:w-auto justify-center"
          >
            Back to Forms
          </Button>

          {error.includes('login') && (
            <Button
              variant="primary"
              icon={FaLock}
              onClick={handleLoginRedirect}
              className="w-full sm:w-auto justify-center"
            >
              Go to Login
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="card text-center">
          <div className="card-body py-10 sm:py-12 px-4 sm:px-6">
            <div className="mx-auto h-14 w-14 sm:h-16 sm:w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FaCheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Thank You!
            </h2>

            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Your submission has been received successfully.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/forms')}
                className="w-full sm:w-auto justify-center"
              >
                View Other Forms
              </Button>

              <Button
                variant="primary"
                onClick={() => setSubmitted(false)}
                className="w-full sm:w-auto justify-center"
              >
                Submit Another Response
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">

        <Button
          variant="outline"
          icon={FaArrowLeft}
          onClick={() => navigate('/forms')}
          className="w-full sm:w-auto justify-center sm:justify-start"
        >
          Back to Forms
        </Button>

        {requiresLogin && !isAuthenticated() && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FaLock className="text-yellow-500 mt-1 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-yellow-700 leading-relaxed">
                This form requires login. Please{' '}
                <button
                  onClick={handleLoginRedirect}
                  className="font-medium underline hover:text-yellow-900 break-words"
                >
                  sign in
                </button>{' '}
                to submit.
              </p>
            </div>
          </div>
        )}

        <div className="w-full overflow-hidden">
          <DynamicForm
            form={form}
            fields={fields}
            onSubmit={handleSubmit}
            submitButtonText={
              requiresLogin && !isAuthenticated()
                ? 'Login to Submit'
                : 'Submit Form'
            }
            disabled={requiresLogin && !isAuthenticated()}
          />
        </div>

        <div className="text-center text-xs sm:text-sm text-gray-500 break-words">
          <p>
            This form was created by{' '}
            {form.createdBy?.firstName} {form.createdBy?.lastName}
          </p>
        </div>

      </div>
    </div>
  );
};

export default FormRenderer;