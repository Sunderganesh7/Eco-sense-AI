import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { RoleRoute } from './components/common/RoleRoute';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { VerifyOtpPage } from './pages/auth/VerifyOtpPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Profile Page
import { UserProfilePage } from './pages/profile/UserProfilePage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ActivityLogsPage } from './pages/admin/ActivityLogsPage';
import { LoginHistoryPage } from './pages/admin/LoginHistoryPage';

const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/profile" replace /> : <Navigate to="/login" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Root */}
              <Route path="/" element={<RootRedirect />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-otp" element={<VerifyOtpPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected User Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* RBAC Protected Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <RoleRoute requiredRoles={['Admin']}>
                      <AdminDashboardPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/logs/activity"
                element={
                  <ProtectedRoute>
                    <RoleRoute requiredRoles={['Admin']}>
                      <ActivityLogsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/logs/logins"
                element={
                  <ProtectedRoute>
                    <RoleRoute requiredRoles={['Admin']}>
                      <LoginHistoryPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
