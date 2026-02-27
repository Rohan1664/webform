import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FormList from '../components/user/FormList';
import FormRenderer from '../components/user/FormRenderer';

const UserPages = () => {
  return (
    <Routes>
      {/* /forms */}
      <Route index element={<FormList />} />

      {/* /forms/:formId */}
      <Route path=":formId" element={<FormRenderer />} />

      {/* /forms/my-submissions */}
      <Route path="my-submissions" element={<div>My Submissions Page</div>} />
    </Routes>
  );
};

export default UserPages;