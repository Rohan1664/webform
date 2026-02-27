module.exports = {
  ROLES: {
    ADMIN: 'admin',
    USER: 'user'
  },
  
  FIELD_TYPES: {
    TEXT: 'text',
    NUMBER: 'number',
    EMAIL: 'email',
    TEXTAREA: 'textarea',
    DROPDOWN: 'dropdown',
    CHECKBOX: 'checkbox',
    RADIO: 'radio',
    FILE: 'file'
  },
  
  VALID_FILE_TYPES: [
    'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'
  ],
  
  MIME_TYPES: {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};