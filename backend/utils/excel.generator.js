const XLSX = require('xlsx');
const FormSubmission = require('../models/FormSubmission.model');
const FormField = require('../models/FormField.model');
const Form = require('../models/Form.model');
const { formatDate } = require('./helpers');

// Generate Excel file from submissions
const generateExcel = async (submissions, formFields) => {
  try {
    // Prepare data for Excel
    const data = submissions.map(submission => {
      const row = {
        'Submission ID': submission._id.toString(),
        'Submitted At': formatDate(submission.submittedAt),
        'Submitted By': submission.submittedBy 
          ? `${submission.submittedBy.firstName} ${submission.submittedBy.lastName} (${submission.submittedBy.email})`
          : 'Anonymous'
      };
      
      // Add form fields data
      formFields.forEach(field => {
        const value = submission.submissionData.get 
          ? submission.submissionData.get(field.name)
          : submission.submissionData[field.name];
        
        if (Array.isArray(value)) {
          row[field.label] = value.join(', ');
        } else if (value !== undefined && value !== null) {
          row[field.label] = value.toString();
        } else {
          row[field.label] = '';
        }
      });
      
      return row;
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer' 
    });
    
    return excelBuffer;
    
  } catch (error) {
    console.error('Excel generation error:', error);
    throw error;
  }
};

// Generate CSV file from submissions (IN-MEMORY VERSION - NO FILE WRITING)
const generateCSV = async (submissions, formFields) => {
  try {
    // Prepare CSV headers (as strings, not objects)
    const headers = [
      'Submission ID',
      'Submitted At',
      'Submitted By',
      ...formFields.map(field => field.label),
      'Files'
    ];
    
    // Prepare CSV rows
    const rows = submissions.map(submission => {
      const row = [
        submission._id.toString(),
        formatDate(submission.submittedAt),
        submission.submittedBy 
          ? `${submission.submittedBy.firstName} ${submission.submittedBy.lastName} (${submission.submittedBy.email})`
          : 'Anonymous'
      ];
      
      // Add form fields data
      formFields.forEach(field => {
        const value = submission.submissionData.get 
          ? submission.submissionData.get(field.name)
          : submission.submissionData[field.name];
        
        let fieldValue = '';
        if (Array.isArray(value)) {
          fieldValue = value.join(', ');
        } else if (value !== undefined && value !== null) {
          fieldValue = value.toString();
        }
        
        // Escape commas and quotes for CSV
        if (fieldValue.includes(',') || fieldValue.includes('"')) {
          fieldValue = `"${fieldValue.replace(/"/g, '""')}"`;
        }
        row.push(fieldValue);
      });
      
      // Add files information
      const fileNames = submission.files?.map(f => f.originalName).join('; ') || '';
      row.push(fileNames.includes(',') ? `"${fileNames}"` : fileNames);
      
      return row.join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    return csvContent;
    
  } catch (error) {
    console.error('CSV generation error:', error);
    throw error;
  }
};

// Download submissions in Excel format
exports.downloadSubmissionsExcel = async (req, res) => {
  try {
    const { formId } = req.params;
    
    const form = await Form.findById(formId);
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }
    
    // Check if user is admin and owns the form
    if (form.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to export this form'
      });
    }
    
    // Get all submissions for this form
    const submissions = await FormSubmission.find({ formId })
      .populate('submittedBy', 'firstName lastName email');
    
    // Get form fields
    const formFields = await FormField.find({ formId }).sort('order');
    
    // Generate Excel file
    const excelBuffer = await generateExcel(submissions, formFields);
    
    // Set response headers for file download
    const filename = `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_submissions_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
    
  } catch (error) {
    console.error('Download Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating Excel file',
      error: error.message
    });
  }
};

// Download submissions in CSV format (UPDATED)
exports.downloadSubmissionsCSV = async (req, res) => {
  try {
    const { formId } = req.params;
    
    const form = await Form.findById(formId);
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }
    
    // Check if user is admin and owns the form
    if (form.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to export this form'
      });
    }
    
    // Get all submissions for this form
    const submissions = await FormSubmission.find({ formId })
      .populate('submittedBy', 'firstName lastName email');
    
    // Get form fields
    const formFields = await FormField.find({ formId }).sort('order');
    
    // Generate CSV content (in memory)
    const csvContent = await generateCSV(submissions, formFields);
    
    // Set response headers for file download
    const filename = `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_submissions_${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
    
    res.send(csvContent);
    
  } catch (error) {
    console.error('Download CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating CSV file',
      error: error.message
    });
  }
};