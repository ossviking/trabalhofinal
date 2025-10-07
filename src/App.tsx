import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginSelection from './components/LoginSelection';
import LoginSolicitante from './components/LoginSolicitante';
import LoginAdministrador from './components/LoginAdministrador';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ResourceCatalog from './components/ResourceCatalog';
import ReservationCalendar from './components/ReservationCalendar';
import RequestForm from './components/RequestForm';
import ApprovalWorkflow from './components/ApprovalWorkflow';
import UsageReports from './components/UsageReports';
import UserManagement from './components/UserManagement';
import ResourceManagement from './components/ResourceManagement';
import PackageManagement from './components/PackageManagement';
import MaintenanceScheduler from './components/MaintenanceScheduler';
import SystemSettings from './components/SystemSettings';
import PasswordResetManagement from './components/PasswordResetManagement';
import AIDashboard from './components/AIDashboard';
import { UserProvider } from './context/UserContext';
import { ReservationProvider } from './context/ReservationContext';
import { ChatProvider } from './context/ChatContext';
import Chat from './components/Chat';
import { useUser } from './context/UserContext';

const AppContent = () => {
  const { user } = useUser();

  return (
    <Router>
      <Routes>
        {/* Rotas de Login */}
        <Route path="/login" element={<LoginSelection />} />
        <Route path="/login/solicitante" element={<LoginSolicitante />} />
        <Route path="/login/administrador" element={<LoginAdministrador />} />
        
        {/* Rotas Protegidas */}
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <Chat />
              <div className="pt-16">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/resources" element={<ResourceCatalog />} />
                  <Route path="/calendar" element={<ReservationCalendar />} />
                  <Route path="/request" element={<RequestForm />} />
                  <Route path="/approvals" element={
                    <ProtectedRoute requiredRole="admin">
                      <ApprovalWorkflow />
                    </ProtectedRoute>
                  } />
                  <Route path="/reports" element={
                    <ProtectedRoute requiredRole="admin">
                      <UsageReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/users" element={
                    <ProtectedRoute requiredRole="admin">
                      <UserManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/resources" element={
                    <ProtectedRoute requiredRole="admin">
                      <ResourceManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/packages" element={
                    <ProtectedRoute>
                      <PackageManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/maintenance" element={
                    <ProtectedRoute requiredRole="admin">
                      <MaintenanceScheduler />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute requiredRole="admin">
                      <SystemSettings />
                    </ProtectedRoute>
                  } />
                  <Route path="/password-reset" element={
                    <ProtectedRoute requiredRole="admin">
                      <PasswordResetManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/ai-insights" element={
                    <ProtectedRoute requiredRole="admin">
                      <AIDashboard />
                    </ProtectedRoute>
                  } />
                </Routes>
              </div>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <UserProvider>
      <ReservationProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </ReservationProvider>
    </UserProvider>
  );
}

export default App;