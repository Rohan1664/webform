const path = require('path');
const fs = require('fs');

// Generate random string
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format date to readable string
const formatDate = (date, format = 'DD/MM/YYYY HH:mm') => {
  if (!date) return '';
  
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year)
    .replace('HH', hours)
    .replace('mm', minutes);
};

// Sanitize filename
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

// Get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase().slice(1);
};

// Delete file if exists
const deleteFileIfExists = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

// Create directory if not exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Parse JSON safely
const safeJSONParse = (str, defaultValue = {}) => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

// Generate pagination metadata
const generatePagination = (page, limit, total) => {
  const pageInt = parseInt(page) || 1;
  const limitInt = parseInt(limit) || 10;
  const totalPages = Math.ceil(total / limitInt);
  
  return {
    page: pageInt,
    limit: limitInt,
    total,
    totalPages,
    hasNextPage: pageInt < totalPages,
    hasPrevPage: pageInt > 1
  };
};

module.exports = {
  generateRandomString,
  formatDate,
  sanitizeFilename,
  getFileExtension,
  deleteFileIfExists,
  ensureDirectoryExists,
  safeJSONParse,
  generatePagination
};