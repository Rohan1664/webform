export const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number Input' },
  { value: 'email', label: 'Email Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'file', label: 'File Upload' },
];

export const VALIDATION_TYPES = {
  REQUIRED: 'required',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  MIN: 'min',
  MAX: 'max',
  PATTERN: 'pattern',
  FILE_TYPES: 'fileTypes',
  MAX_FILE_SIZE: 'maxFileSize',
};

export const ALLOWED_FILE_TYPES = [
  { value: 'jpg', label: 'JPEG Image' },
  { value: 'jpeg', label: 'JPEG Image' },
  { value: 'png', label: 'PNG Image' },
  { value: 'gif', label: 'GIF Image' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'doc', label: 'Word Document' },
  { value: 'docx', label: 'Word Document' },
  { value: 'txt', label: 'Text File' },
  { value: 'xls', label: 'Excel File' },
  { value: 'xlsx', label: 'Excel File' },
];

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_FORMS: '/admin/forms',
  ADMIN_SUBMISSIONS: '/admin/submissions',
  USER_FORMS: '/forms',
  USER_SUBMISSIONS: '/my-submissions',
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
};

export const API_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};