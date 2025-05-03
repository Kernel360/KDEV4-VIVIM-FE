import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardAdmin from './pages/DashboardAdmin';
import ProjectCreate from './pages/ProjectCreate';
import ProjectModify from './pages/ProjectModify';
import CompanyManagement from './pages/CompanyManagement';
import UserManagement from './pages/UserManagement';
import CompanyCreate from './pages/CompanyCreate';
import UserCreate from './pages/UserCreate';
import CompanyEdit from './pages/CompanyEdit';
import AdminProjectList from './pages/AdminProjectList';
import ProjectDetail from './pages/ProjectDetail';
import UserEdit from './pages/UserEdit';
import AuditLog from './pages/AuditLog';
import ApprovalDetail from './pages/ApprovalDetail';

import UserProjectList from './pages/UserProjectList';
import ProjectPostCreate from './pages/ProjectPostCreate';
import ProjectPostDetail from './pages/ProjectPostDetail';
import ProjectPostModify from './pages/ProjectPostModify';
import AdminInquiry from './pages/AdminInquiry';
import AdminInquiryList from './pages/AdminInquiryList';
import AdminInquiryDetail from './pages/AdminInquiryDetail';
import AdminInquiryEdit from './pages/AdminInquiryEdit';
import { setNavigate } from './utils/axiosInstance';
import { NotificationProvider } from './contexts/NotificationContext';

const AppContent = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard-admin" element={<ProtectedRoute><DashboardAdmin /></ProtectedRoute>} />
      <Route path="/admin-inquiry" element={<ProtectedRoute><AdminInquiry /></ProtectedRoute>} />
      <Route path="/admin-inquiry-list" element={<ProtectedRoute><AdminInquiryList /></ProtectedRoute>} />
      <Route path="/admin-inquiry-list/:id" element={<ProtectedRoute><AdminInquiryDetail /></ProtectedRoute>} />
      <Route path="/admin-inquiry-list/:id/edit" element={<ProtectedRoute><AdminInquiryEdit /></ProtectedRoute>} />
      <Route path="/projectCreate" element={<ProtectedRoute><ProjectCreate /></ProtectedRoute>} />
      <Route path="/projectModify/:projectId" element={<ProtectedRoute><ProjectModify /></ProtectedRoute>} />
      <Route path="/company-management" element={<ProtectedRoute><CompanyManagement /></ProtectedRoute>} />
      <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/company-create" element={<ProtectedRoute><CompanyCreate /></ProtectedRoute>} />
      <Route path="/user-create" element={<ProtectedRoute><UserCreate /></ProtectedRoute>} />
      <Route path="/company-edit/:id" element={<ProtectedRoute><CompanyEdit /></ProtectedRoute>} />
      <Route path="/project-list" element={<ProtectedRoute><UserProjectList /></ProtectedRoute>} />
      <Route path="/admin-projects" element={<ProtectedRoute><AdminProjectList /></ProtectedRoute>} />
      <Route path="/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/project/:projectId/post/:postId" element={<ProtectedRoute><ProjectPostDetail /></ProtectedRoute>} />
      <Route path="/project/:projectId/post/create" element={<ProtectedRoute><ProjectPostCreate /></ProtectedRoute>} />
      <Route path="/project/:projectId/post/:postId/modify" element={<ProtectedRoute><ProjectPostModify /></ProtectedRoute>} />
      <Route path="/approval/:id" element={<ProtectedRoute><ApprovalDetail /></ProtectedRoute>} />
      <Route path="/audit-log" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
      <Route path="/user-edit/:userId" element={<ProtectedRoute><UserEdit /></ProtectedRoute>} />
    </Routes>
  );
};

const App = () => {
  return (
    <NotificationProvider>
      <Router>
        <AppContent />
      </Router>
    </NotificationProvider>
  );
};

export default App;
