const XLSX = require('xlsx');
const User = require('../models/User.model');

// Format date helper
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return 'Never';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// Export users to Excel
exports.exportUsersToExcel = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    // Get users
    const users = await User.find(query)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 });
    
    // Prepare data for Excel
    const data = users.map(user => ({
      'User ID': user._id.toString(),
      'First Name': user.firstName || '',
      'Last Name': user.lastName || '',
      'Email': user.email || '',
      'Role': user.role || 'user',
      'Status': user.isActive ? 'Active' : 'Inactive',
      'Joined Date': formatDate(user.createdAt, 'YYYY-MM-DD HH:mm:ss'),
      'Last Updated': formatDate(user.updatedAt, 'YYYY-MM-DD HH:mm:ss'),
      'Last Login': user.lastLogin ? formatDate(user.lastLogin, 'YYYY-MM-DD HH:mm:ss') : 'Never'
    }));
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    const colWidths = [
      { wch: 25 }, // User ID
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 30 }, // Email
      { wch: 10 }, // Role
      { wch: 10 }, // Status
      { wch: 20 }, // Joined Date
      { wch: 20 }, // Last Updated
      { wch: 20 }  // Last Login
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    
    // Generate buffer
    const excelBuffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'buffer' 
    });
    
    // Generate filename
    const timestamp = formatDate(new Date(), 'YYYYMMDD_HHmmss');
    const filename = `users_export_${timestamp}.xlsx`;
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
    
  } catch (error) {
    console.error('Export users to Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting users to Excel',
      error: error.message
    });
  }
};

// Export users to CSV
exports.exportUsersToCSV = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    // Get users
    const users = await User.find(query)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 });
    
    // Prepare CSV headers
    const headers = [
      'User ID',
      'First Name',
      'Last Name',
      'Email',
      'Role',
      'Status',
      'Joined Date',
      'Last Updated',
      'Last Login'
    ];
    
    // Prepare CSV rows
    const rows = users.map(user => {
      const row = [
        user._id.toString(),
        user.firstName || '',
        user.lastName || '',
        user.email || '',
        user.role || 'user',
        user.isActive ? 'Active' : 'Inactive',
        formatDate(user.createdAt, 'YYYY-MM-DD HH:mm:ss'),
        formatDate(user.updatedAt, 'YYYY-MM-DD HH:mm:ss'),
        user.lastLogin ? formatDate(user.lastLogin, 'YYYY-MM-DD HH:mm:ss') : 'Never'
      ];
      
      // Escape fields that contain commas or quotes
      return row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Generate filename
    const timestamp = formatDate(new Date(), 'YYYYMMDD_HHmmss');
    const filename = `users_export_${timestamp}.csv`;
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent));
    
    res.send(csvContent);
    
  } catch (error) {
    console.error('Export users to CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting users to CSV',
      error: error.message
    });
  }
};