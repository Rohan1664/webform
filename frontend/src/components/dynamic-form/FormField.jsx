import React, { useState, useEffect } from 'react';
import { FaUpload, FaTrash } from 'react-icons/fa';
import Input from '../common/Input';
import Button from '../common/Button';

const FormField = ({ 
  field, 
  value, 
  onChange, 
  error, 
  disabled = false 
}) => {
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onChange(field.name, file);
      const preview = URL.createObjectURL(file);
      setFilePreview(preview);
    }
  };

  const removeFile = () => {
    onChange(field.name, null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const renderField = () => {
    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            label={field.label}
            name={field.name}
            type={field.fieldType}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            error={error}
            placeholder={field.placeholder}
            required={field.validation?.required}
            disabled={disabled}
          />
        );

      case 'textarea':
        return (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.validation?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <textarea
              name={field.name}
              value={value || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={disabled}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'dropdown':
        return (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.validation?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <select
              name={field.name}
              value={value || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={disabled}
            >
              <option value="">Select an option</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.validation?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    name={field.name}
                    value={option.value}
                    checked={value?.includes(option.value) || false}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...(value || []), option.value]
                        : (value || []).filter(v => v !== option.value);
                      onChange(field.name, newValue);
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    disabled={disabled}
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.validation?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    disabled={disabled}
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.validation?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            
            {value ? (
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center">
                    <FaUpload className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {value.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(value.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeFile}
                  disabled={disabled}
                >
                  <FaTrash className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 transition-colors">
                <div className="space-y-1 text-center">
                  <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        name={field.name}
                        onChange={handleFileChange}
                        className="sr-only"
                        accept={field.validation?.fileTypes?.map(type => `.${type}`).join(',')}
                        disabled={disabled}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {field.validation?.fileTypes?.join(', ').toUpperCase() || 'Any file'} up to {field.validation?.maxFileSize ? (field.validation.maxFileSize / 1024 / 1024).toFixed(0) : 5}MB
                  </p>
                </div>
              </div>
            )}
            
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="space-y-1">{renderField()}</div>;
};

export default FormField;