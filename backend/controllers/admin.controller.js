const connectDB = require('../config/db');
const User = require('../models/User.model');
const Form = require('../models/Form.model');
const FormSubmission = require('../models/FormSubmission.model');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    await connectDB();
    
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const query = {};
    
    // Build search query
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by role
    if (role) {
      query.role = role;
    }
    
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitInt);
    
    // Get total count
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limitInt);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageInt,
          limit: limitInt,
          totalUsers,
          totalPages,
          hasNextPage: pageInt < totalPages,
          hasPrevPage: pageInt > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user status (admin only)
exports.updateUserStatus = async (req, res) => {
  try {
    await connectDB();
    
    const { userId } = req.params;
    const { isActive } = req.body;
    
    // Cannot update yourself
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update your own status'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
    
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user details (EDIT)
exports.updateUser = async (req, res) => {
  try {
    await connectDB();
    
    const { userId } = req.params;
    const { firstName, lastName, email, role } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }
    
    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role) user.role = role;
    
    user.updatedAt = Date.now();
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(userId).select('-password');
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    await connectDB();
    
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deleting yourself
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    await connectDB();
    
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalForms = await Form.countDocuments();
    const totalSubmissions = await FormSubmission.countDocuments();
    
    // Get recent submissions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSubmissions = await FormSubmission.countDocuments({
      submittedAt: { $gte: sevenDaysAgo }
    });
    
    // Get forms by month for chart
    const formsByMonth = await Form.aggregate([
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalAdmins,
          totalForms,
          totalSubmissions,
          recentSubmissions
        },
        charts: {
          formsByMonth
        }
      }
    });
    
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};