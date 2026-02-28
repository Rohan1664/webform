import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaPlus, 
  FaTrash, 
  FaGripVertical, 
  FaCopy,
  FaEye,
  FaSave,
  FaArrowLeft 
} from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../common/Button';
import Input from '../common/Input';
import { formAPI } from '../../api/form.api';
import { FIELD_TYPES, ALLOWED_FILE_TYPES } from '../../utils/constants';
import toast from 'react-hot-toast';
import Loader from '../common/Loader';

const FormBuilder = () => {
  const navigate = useNavigate();
  const { formId } = useParams();
  const isEditMode = !!formId;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [formSettings, setFormSettings] = useState({
    allowMultipleSubmissions: false,
    requireLogin: true,
    confirmationMessage: 'Thank you for your submission!',
    redirectUrl: '',
    submissionLimit: 0,
    startDate: '',
    endDate: ''
  });
  const [appearance, setAppearance] = useState({
    theme: 'light',
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    submitButtonText: 'Submit'
  });

  // Memoize fetchFormData with all dependencies
  const fetchFormData = useCallback(async () => {
    if (!isEditMode || !formId) return;
    
    try {
      setLoading(true);
      const response = await formAPI.getFormById(formId);
      const form = response.data.form;
      const formFields = response.data.fields;
      
      setFormTitle(form.title || '');
      setFormDescription(form.description || '');
      setFormSettings({
        allowMultipleSubmissions: form.settings?.allowMultipleSubmissions || false,
        requireLogin: form.settings?.requireLogin !== false,
        confirmationMessage: form.settings?.confirmationMessage || 'Thank you for your submission!',
        redirectUrl: form.settings?.redirectUrl || '',
        submissionLimit: form.settings?.submissionLimit || 0,
        startDate: form.settings?.startDate || '',
        endDate: form.settings?.endDate || ''
      });
      setAppearance(form.appearance || {
        theme: 'light',
        primaryColor: '#3b82f6',
        backgroundColor: '#ffffff',
        submitButtonText: 'Submit'
      });
      setFields(formFields || []);
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Failed to load form data');
      navigate('/admin/forms');
    } finally {
      setLoading(false);
    }
  }, [isEditMode, formId, navigate]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  const handlePreview = () => {
    if (formId) {
      window.open(`/forms/${formId}`, '_blank');
    } else {
      toast.error('Please save the form first to preview');
    }
  };

  const addField = (fieldType) => {
    const newField = {
      _id: `field-${Date.now()}`,
      label: `New ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
      fieldType,
      name: `field_${Date.now()}`,
      placeholder: '',
      options: ['dropdown', 'checkbox', 'radio'].includes(fieldType) 
        ? [{ label: 'Option 1', value: 'option1' }]
        : [],
      validation: {
        required: false,
        minLength: null,
        maxLength: null,
        min: null,
        max: null,
        pattern: '',
        patternMessage: '',
        fileTypes: [],
        maxFileSize: 5 * 1024 * 1024,
        maxFileCount: 1
      },
      layout: {
        width: 'full',
        showLabel: true,
        cssClass: ''
      },
      helpText: '',
      order: fields.length,
      isActive: true
    };
    
    setFields([...fields, newField]);
    toast.success('Field added successfully');
  };

  const removeField = (fieldId) => {
    if (!window.confirm('Are you sure you want to remove this field?')) {
      return;
    }
    
    setFields(fields.filter(field => field._id !== fieldId));
    toast.success('Field removed');
  };

  const duplicateField = (field) => {
    const newField = {
      ...field,
      _id: `field-${Date.now()}`,
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`,
      order: fields.length
    };
    
    setFields([...fields, newField]);
    toast.success('Field duplicated');
  };

  const updateField = (fieldId, updates) => {
    setFields(fields.map(field => 
      field._id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setFields(reorderedItems);
  };

  const validateForm = () => {
    if (!formTitle.trim()) {
      toast.error('Form title is required');
      return false;
    }
    
    if (fields.length === 0) {
      toast.error('Please add at least one field to the form');
      return false;
    }

    const fieldNames = fields.map(f => f.name);
    const duplicateNames = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      toast.error('Field names must be unique');
      return false;
    }

    for (const field of fields) {
      if (!field.name || !/^[a-z0-9_]+$/.test(field.name)) {
        toast.error(`Field name "${field.name}" can only contain lowercase letters, numbers, and underscores`);
        return false;
      }
    }

    for (const field of fields) {
      if (['dropdown', 'checkbox', 'radio'].includes(field.fieldType)) {
        if (!field.options || field.options.length === 0) {
          toast.error(`${field.label} must have at least one option`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const formData = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        settings: formSettings,
        appearance,
        fields: fields.map(({ _id, ...field }) => ({
          label: field.label,
          fieldType: field.fieldType,
          name: field.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          placeholder: field.placeholder || '',
          options: field.options || [],
          validation: field.validation || {},
          layout: field.layout || { width: 'full' },
          helpText: field.helpText || '',
          order: field.order,
          isActive: true
        }))
      };

      let response;
      if (isEditMode) {
        response = await formAPI.updateForm(formId, formData);
        toast.success('Form updated successfully');
        await fetchFormData();
      } else {
        response = await formAPI.createForm(formData);
        toast.success('Form created successfully');
        if (response.data?.form?._id) {
          navigate(`/admin/forms/edit/${response.data.form._id}`);
        } else {
          navigate('/admin/forms');
        }
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(error.response?.data?.message || 'Failed to save form');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFieldEditor = (field) => {
    const isOptionField = ['dropdown', 'checkbox', 'radio'].includes(field.fieldType);
    const isFileField = field.fieldType === 'file';
    
    return (
      <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Field Label"
            value={field.label}
            onChange={(e) => updateField(field._id, { label: e.target.value })}
            required
          />
          
          <Input
            label="Field Name"
            value={field.name}
            onChange={(e) => updateField(field._id, { 
              name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') 
            })}
            helperText="Used for data storage (no spaces, lowercase)"
            required
          />
        </div>
        
        <Input
          label="Placeholder Text"
          value={field.placeholder || ''}
          onChange={(e) => updateField(field._id, { placeholder: e.target.value })}
        />

        <Input
          label="Help Text"
          value={field.helpText || ''}
          onChange={(e) => updateField(field._id, { helpText: e.target.value })}
        />
        
        {isOptionField && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Options
            </label>
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={option.label}
                  onChange={(e) => {
                    const newOptions = [...field.options];
                    newOptions[index] = { 
                      ...newOptions[index], 
                      label: e.target.value,
                      value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                    };
                    updateField(field._id, { options: newOptions });
                  }}
                  placeholder="Option label"
                  containerClassName="flex-1"
                />
                <Input
                  value={option.value}
                  onChange={(e) => {
                    const newOptions = [...field.options];
                    newOptions[index] = { 
                      ...newOptions[index], 
                      value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                    };
                    updateField(field._id, { options: newOptions });
                  }}
                  placeholder="Option value"
                  containerClassName="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = field.options.filter((_, i) => i !== index);
                    updateField(field._id, { options: newOptions });
                  }}
                >
                  <FaTrash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newOptions = [
                  ...(field.options || []),
                  { 
                    label: `Option ${(field.options?.length || 0) + 1}`, 
                    value: `option${(field.options?.length || 0) + 1}` 
                  }
                ];
                updateField(field._id, { options: newOptions });
              }}
            >
              Add Option
            </Button>
          </div>
        )}
        
        {isFileField && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed File Types
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {ALLOWED_FILE_TYPES.map((fileType) => (
                    <label key={fileType.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.validation?.fileTypes?.includes(fileType.value)}
                        onChange={(e) => {
                          const currentTypes = field.validation?.fileTypes || [];
                          const newTypes = e.target.checked
                            ? [...currentTypes, fileType.value]
                            : currentTypes.filter(t => t !== fileType.value);
                          updateField(field._id, {
                            validation: { ...field.validation, fileTypes: newTypes }
                          });
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">{fileType.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <Input
                  label="Max File Size (MB)"
                  type="number"
                  value={field.validation?.maxFileSize ? field.validation.maxFileSize / (1024 * 1024) : 5}
                  onChange={(e) => {
                    const sizeMB = parseInt(e.target.value) || 5;
                    updateField(field._id, {
                      validation: { ...field.validation, maxFileSize: sizeMB * 1024 * 1024 }
                    });
                  }}
                  min="1"
                  max="50"
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700">Validation Rules</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.validation?.required || false}
                onChange={(e) => updateField(field._id, {
                  validation: { ...field.validation, required: e.target.checked }
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">Required field</span>
            </label>
            
            {['text', 'textarea', 'email'].includes(field.fieldType) && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Min Length"
                    type="number"
                    value={field.validation?.minLength || ''}
                    onChange={(e) => updateField(field._id, {
                      validation: { ...field.validation, minLength: parseInt(e.target.value) || null }
                    })}
                    min="0"
                  />
                  
                  <Input
                    label="Max Length"
                    type="number"
                    value={field.validation?.maxLength || ''}
                    onChange={(e) => updateField(field._id, {
                      validation: { ...field.validation, maxLength: parseInt(e.target.value) || null }
                    })}
                    min="1"
                  />
                </div>
              </>
            )}
            
            {field.fieldType === 'number' && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Minimum Value"
                  type="number"
                  value={field.validation?.min || ''}
                  onChange={(e) => updateField(field._id, {
                    validation: { ...field.validation, min: parseFloat(e.target.value) || null }
                  })}
                />
                
                <Input
                  label="Maximum Value"
                  type="number"
                  value={field.validation?.max || ''}
                  onChange={(e) => updateField(field._id, {
                    validation: { ...field.validation, max: parseFloat(e.target.value) || null }
                  })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" text="Loading form..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            icon={FaArrowLeft}
            onClick={() => navigate('/admin/forms')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Form' : 'Create New Form'}
            </h1>
            <p className="mt-2 text-gray-600">
              {isEditMode 
                ? 'Modify your form configuration' 
                : 'Create and customize your form with drag-and-drop fields'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            icon={FaEye} 
            onClick={handlePreview}
            disabled={!formId}
            title={!formId ? 'Save the form first to preview' : 'Preview form'}
          >
            Preview
          </Button>
          <Button 
            variant="primary" 
            icon={FaSave} 
            onClick={handleSubmit}
            loading={submitting}
          >
            {isEditMode ? 'Update Form' : 'Save Form'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Form Settings</h3>
            </div>
            <div className="card-body space-y-4">
              <Input
                label="Form Title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., Customer Feedback Form"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Brief description of the form..."
                />
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Submission Settings</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formSettings.allowMultipleSubmissions}
                      onChange={(e) => setFormSettings({
                        ...formSettings,
                        allowMultipleSubmissions: e.target.checked
                      })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      Allow multiple submissions from same user
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formSettings.requireLogin}
                      onChange={(e) => setFormSettings({
                        ...formSettings,
                        requireLogin: e.target.checked
                      })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      Require login to submit
                    </span>
                  </label>
                </div>

                <Input
                  label="Submission Limit (0 = unlimited)"
                  type="number"
                  value={formSettings.submissionLimit}
                  onChange={(e) => setFormSettings({
                    ...formSettings,
                    submissionLimit: parseInt(e.target.value) || 0
                  })}
                  min="0"
                />

                <Input
                  label="Confirmation Message"
                  value={formSettings.confirmationMessage}
                  onChange={(e) => setFormSettings({
                    ...formSettings,
                    confirmationMessage: e.target.value
                  })}
                  placeholder="Thank you for your submission!"
                />

                <Input
                  label="Redirect URL (optional)"
                  value={formSettings.redirectUrl}
                  onChange={(e) => setFormSettings({
                    ...formSettings,
                    redirectUrl: e.target.value
                  })}
                  placeholder="https://example.com/thank-you"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start Date"
                    type="datetime-local"
                    value={formSettings.startDate}
                    onChange={(e) => setFormSettings({
                      ...formSettings,
                      startDate: e.target.value
                    })}
                  />
                  <Input
                    label="End Date"
                    type="datetime-local"
                    value={formSettings.endDate}
                    onChange={(e) => setFormSettings({
                      ...formSettings,
                      endDate: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Appearance</h4>
                <Input
                  label="Submit Button Text"
                  value={appearance.submitButtonText}
                  onChange={(e) => setAppearance({
                    ...appearance,
                    submitButtonText: e.target.value
                  })}
                  placeholder="Submit"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={appearance.primaryColor}
                    onChange={(e) => setAppearance({
                      ...appearance,
                      primaryColor: e.target.value
                    })}
                    className="h-10 w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Add Fields</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-3">
                {FIELD_TYPES.map((fieldType) => (
                  <button
                    key={fieldType.value}
                    type="button"
                    onClick={() => addField(fieldType.value)}
                    className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center mb-2">
                      <span className="text-primary-600 font-medium">
                        {fieldType.label.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {fieldType.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Form Fields ({fields.length})
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Drag and drop to reorder fields
              </p>
            </div>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="fields">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="card-body space-y-4"
                  >
                    {fields.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FaPlus className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No fields added yet
                        </h3>
                        <p className="text-gray-600">
                          Add fields from the left panel to start building your form
                        </p>
                      </div>
                    ) : (
                      fields.map((field, index) => (
                        <Draggable
                          key={field._id}
                          draggableId={field._id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
                                <div className="flex items-center space-x-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-move text-gray-400 hover:text-gray-600"
                                  >
                                    <FaGripVertical className="h-5 w-5" />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {field.fieldType}
                                    </span>
                                    <span className="font-medium text-gray-900">
                                      {field.label}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => duplicateField(field)}
                                    title="Duplicate"
                                  >
                                    <FaCopy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeField(field._id)}
                                    title="Delete"
                                  >
                                    <FaTrash className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="p-4">
                                {renderFieldEditor(field)}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;