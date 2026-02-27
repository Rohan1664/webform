const XLSX = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const FormSubmission = require('../models/FormSubmission.model');
const FormField = require('../models/FormField.model');
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

// Generate CSV file from submissions
const generateCSV = async (submissions, formFields) => {
  try {
    // Prepare CSV headers
    const csvHeaders = [
      { id: 'submissionId', title: 'Submission ID' },
      { id: 'submittedAt', title: 'Submitted At' },
      { id: 'submittedBy', title: 'Submitted By' }
    ];
    
    // Add form fields as headers
    formFields.forEach(field => {
      csvHeaders.push({
        id: field.name,
        title: field.label
      });
    });
    
    // Prepare data
    const records = submissions.map(submission => {
      const record = {
        submissionId: submission._id.toString(),
        submittedAt: formatDate(submission.submittedAt),
        submittedBy: submission.submittedBy 
          ? `${submission.submittedBy.firstName} ${submission.submittedBy.lastName} (${submission.submittedBy.email})`
          : 'Anonymous'
      };
      
      // Add form fields data
      formFields.forEach(field => {
        const value = submission.submissionData.get 
          ? submission.submissionData.get(field.name)
          : submission.submissionData[field.name];
        
        if (Array.isArray(value)) {
          record[field.name] = value.join(', ');
        } else if (value !== undefined && value !== null) {
          record[field.name] = value.toString();
        } else {
          record[field.name] = '';
        }
      });
      
      return record;
    });
    
    // Create CSV writer
    const csvWriter = createCsvWriter({
      path: 'temp.csv',
      header: csvHeaders
    });
    
    // Write to file
    await csvWriter.writeRecords(records);
    
    // Read file content
    const fs = require('fs');
    const csvContent = fs.readFileSync('temp.csv', 'utf8');
    
    // Clean up temp file
    fs.unlinkSync('temp.csv');
    
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
    
    // Get form and verify ownership
    const form = await FormSubmission.findOne({ 
      _id: formId,
      createdBy: req.user.userId 
    });
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or unauthorized'
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
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=submissions_${formId}_${Date.now()}.xlsx`);
    
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

// Download submissions in CSV format
exports.downloadSubmissionsCSV = async (req, res) => {
  try {
    const { formId } = req.params;
    
    // Get form and verify ownership
    const form = await FormSubmission.findOne({ 
      _id: formId,
      createdBy: req.user.userId 
    });
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or unauthorized'
      });
    }
    
    // Get all submissions for this form
    const submissions = await FormSubmission.find({ formId })
      .populate('submittedBy', 'firstName lastName email');
    
    // Get form fields
    const formFields = await FormField.find({ formId }).sort('order');
    
    // Generate CSV content
    const csvContent = await generateCSV(submissions, formFields);
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=submissions_${formId}_${Date.now()}.csv`);
    
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