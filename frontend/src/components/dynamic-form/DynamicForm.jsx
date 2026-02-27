import React, { useState } from 'react';
import FormField from './FormField';
import Button from '../common/Button';
import Loader from '../common/Loader';
import { validateForm } from '../../utils/validators';

const DynamicForm = ({ 
  form, 
  fields, 
  onSubmit, 
  submitButtonText = 'Submit',
  disabled = false,
  initialData = {}
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const { isValid, errors: validationErrors } = validateForm(formData, fields);
    setErrors(validationErrors);
    
    if (!isValid) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!form || !fields) {
    return (
      <div className="text-center py-12">
        <Loader size="lg" text="Loading form..." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h2 className="text-2xl font-bold text-gray-900">{form.title}</h2>
          {form.description && (
            <p className="mt-2 text-gray-600">{form.description}</p>
          )}
        </div>
        
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {fields
              .sort((a, b) => a.order - b.order)
              .map((field) => (
                <FormField
                  key={field._id || field.name}
                  field={field}
                  value={formData[field.name]}
                  onChange={handleFieldChange}
                  error={errors[field.name]?.[0]}
                  disabled={disabled || isSubmitting}
                />
              ))}
            
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={disabled}
                className="min-w-[120px]"
              >
                {submitButtonText}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DynamicForm;