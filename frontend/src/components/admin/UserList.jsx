import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaUserCheck, 
  FaUserTimes,
  FaFileExcel,
  FaFileCsv,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import { adminAPI } from '../../api/admin.api';
import Input from '../common/Input';
import Button from '../common/Button';
import Loader from '../common/Loader';
import Alert from '../common/Alert';
import toast from 'react-hot-toast';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalUsers: 0,
    totalPages: 1,
  });
  
  // State for editing user
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      };
      
      const response = await adminAPI.getUsers(params);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Edit button click
  const handleEditClick = (user) => {
    setEditingUser(user._id);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'user'
    });
  };

  // Handle Edit form input change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: ''
    });
  };

  // Handle Save Edit
  const handleSaveEdit = async (userId) => {
    const toastId = toast.loading('Updating user...');
    
    try {
      // You'll need to add this method to your adminAPI
      const response = await adminAPI.updateUser(userId, editFormData);
      
      if (response.success) {
        toast.success('User updated successfully', { id: toastId });
        setEditingUser(null);
        fetchUsers(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to update user');
      }
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update user', { id: toastId });
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    const toastId = toast.loading('Deleting user...');
    
    try {
      // You'll need to add this method to your adminAPI
      const response = await adminAPI.deleteUser(userId);
      
      if (response.success) {
        toast.success('User deleted successfully', { id: toastId });
        fetchUsers(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete user', { id: toastId });
    }
  };

  const handleExport = async (format = 'excel') => {
    const toastId = toast.loading(`Preparing ${format.toUpperCase()} export...`);
    
    try {
      const params = {
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      };
      
      let response;
      if (format === 'excel') {
        response = await adminAPI.exportUsersToExcel(params);
      } else {
        response = await adminAPI.exportUsersToCSV(params);
      }
      
      if (!response.data || response.data.size === 0) {
        throw new Error('No data received from server');
      }
      
      const date = new Date();
      const timestamp = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
      const filename = `users_export_${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      window.URL.revokeObjectURL(url);
      
      toast.success(`${format.toUpperCase()} export completed successfully!`, { id: toastId });
    } catch (err) {
      console.error('Export error:', err);
      
      let errorMessage = `Failed to export as ${format.toUpperCase()}`;
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Unauthorized. Please login again.';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to export.';
        } else if (err.response.status === 404) {
          errorMessage = 'Export endpoint not found.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage, { id: toastId });
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    const toastId = toast.loading(`${currentStatus ? 'Deactivating' : 'Activating'} user...`);
    
    try {
      await adminAPI.updateUserStatus(userId, !currentStatus);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`, { id: toastId });
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user status', { id: toastId });
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" text="Loading users..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage registered users and their permissions
          </p>
        </div>
        {(search || roleFilter || statusFilter) && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filters and search */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search users by name or email..."
                value={search}
                onChange={handleSearch}
                icon={FaSearch}
              />
            </div>
            
            <div>
              <select
                value={roleFilter}
                onChange={(e) => handleRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <Alert type="error" title="Error" message={error} />}

      {/* Users table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">User</th>
                <th className="table-header-cell">Email</th>
                <th className="table-header-cell">Role</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Joined</th>
                <th className="table-header-cell">Last Login</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FaSearch className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">No users found</p>
                      <p className="text-sm text-gray-600">
                        {search || roleFilter || statusFilter 
                          ? 'No users match your filters' 
                          : 'There are no users to display'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="table-row hover:bg-gray-50">
                    <td className="table-cell">
                      {editingUser === user._id ? (
                        <div className="space-y-2">
                          <Input
                            name="firstName"
                            value={editFormData.firstName}
                            onChange={handleEditChange}
                            placeholder="First name"
                            size="sm"
                          />
                          <Input
                            name="lastName"
                            value={editFormData.lastName}
                            onChange={handleEditChange}
                            placeholder="Last name"
                            size="sm"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      {editingUser === user._id ? (
                        <Input
                          name="email"
                          type="email"
                          value={editFormData.email}
                          onChange={handleEditChange}
                          placeholder="Email"
                          size="sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{user.email}</div>
                      )}
                    </td>
                    <td className="table-cell">
                      {editingUser === user._id ? (
                        <select
                          name="role"
                          value={editFormData.role}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="table-cell text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        {editingUser === user._id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(user._id)}
                              className="p-2 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-50"
                              title="Save"
                            >
                              <FaSave className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-50"
                              title="Cancel"
                            >
                              <FaTimes className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStatusToggle(user._id, user.isActive)}
                              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {user.isActive ? (
                                <FaUserTimes className="h-4 w-4 text-red-600" />
                              ) : (
                                <FaUserCheck className="h-4 w-4 text-green-600" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEditClick(user)}
                              className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                              title="Edit User"
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`)}
                              className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50"
                              title="Delete User"
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="card-footer">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.totalUsers)}
                </span>{' '}
                of <span className="font-medium">{pagination.totalUsers}</span> users
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export options */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Export Data</h3>
              <p className="text-sm text-gray-600">
                Export user data with current filters
              </p>
              {(search || roleFilter || statusFilter) && (
                <p className="text-xs text-primary-600 mt-1">
                  Current filters will be applied to export
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                icon={FaFileCsv}
                onClick={() => handleExport('csv')}
                disabled={users.length === 0}
              >
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                icon={FaFileExcel}
                onClick={() => handleExport('excel')}
                disabled={users.length === 0}
              >
                Export Excel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;