export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 6 characters, one uppercase, one lowercase, one number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return re.test(password);
};

export const validateField = (value, fieldConfig) => {
  const errors = [];

  if (fieldConfig.validation?.required && !value && value !== 0) {
    errors.push('This field is required');
  }

  if (value !== undefined && value !== '' && value !== null) {
    switch (fieldConfig.fieldType) {
      case 'email':
        if (!validateEmail(value)) {
          errors.push('Please enter a valid email address');
        }
        break;

      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push('Please enter a valid number');
        } else {
          if (fieldConfig.validation?.min !== undefined && numValue < fieldConfig.validation.min) {
            errors.push(`Value must be at least ${fieldConfig.validation.min}`);
          }
          if (fieldConfig.validation?.max !== undefined && numValue > fieldConfig.validation.max) {
            errors.push(`Value must be at most ${fieldConfig.validation.max}`);
          }
        }
        break;

      case 'text':
      case 'textarea':
        if (fieldConfig.validation?.minLength && value.length < fieldConfig.validation.minLength) {
          errors.push(`Minimum ${fieldConfig.validation.minLength} characters required`);
        }
        if (fieldConfig.validation?.maxLength && value.length > fieldConfig.validation.maxLength) {
          errors.push(`Maximum ${fieldConfig.validation.maxLength} characters allowed`);
        }
        if (fieldConfig.validation?.pattern) {
          const regex = new RegExp(fieldConfig.validation.pattern);
          if (!regex.test(value)) {
            errors.push('Invalid format');
          }
        }
        break;

      case 'file':
        if (value && value[0]) {
          const file = value[0];
          if (fieldConfig.validation?.fileTypes) {
            const allowedTypes = fieldConfig.validation.fileTypes;
            const fileExt = file.name.split('.').pop().toLowerCase();
            const fileType = file.type.toLowerCase();
            
            if (!allowedTypes.includes(fileExt) && !allowedTypes.includes(fileType)) {
              errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
            }
          }
          if (fieldConfig.validation?.maxFileSize && file.size > fieldConfig.validation.maxFileSize) {
            const maxSizeMB = fieldConfig.validation.maxFileSize / (1024 * 1024);
            errors.push(`File size must be less than ${maxSizeMB}MB`);
          }
        }
        break;
    }
  }

  return errors;
};

export const validateForm = (formData, formFields) => {
  const errors = {};
  let isValid = true;

  formFields.forEach(field => {
    const fieldErrors = validateField(formData[field.name], field);
    if (fieldErrors.length > 0) {
      errors[field.name] = fieldErrors;
      isValid = false;
    }
  });

  return { isValid, errors };
};