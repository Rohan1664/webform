import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '../components/admin/Dashboard';
import UserList from '../components/admin/UserList';
import FormBuilder from '../components/admin/FormBuilder';
import FormsList from '../components/admin/FormsList';
import FormsListForSubmissions from '../components/admin/FormsListForSubmissions';
import SubmissionsTable from '../components/admin/SubmissionsTable';

const AdminPages = () => {
  return (
    <Routes>
      {/* Dashboard route */}
      <Route path="/dashboard" element={<Dashboard />} />
      
      {/* Users management route */}
      <Route path="/users" element={<UserList />} />
      
      {/* Forms management routes */}
      <Route path="/forms" element={<FormsList />} />
      <Route path="/forms/new" element={<FormBuilder />} />
      <Route path="/forms/edit/:formId" element={<FormBuilder />} />
      
      {/* Submissions routes */}
      <Route path="/submissions" element={<FormsListForSubmissions />} />
      <Route path="/submissions/:formId" element={<SubmissionsTable />} />
      <Route path="/submissions/:formId/view/:submissionId" element={<div>Submission Details Page</div>} />
      <Route path="/submissions/:formId/stats" element={<div>Submission Statistics Page</div>} />
      
      {/* Default redirect */}
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
};

export default AdminPages;