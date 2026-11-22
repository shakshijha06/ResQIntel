import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { PublicLandingPage } from './pages/public/PublicLandingPage';
import { PublicExplorerPage } from './pages/public/PublicExplorerPage';
import { PublicReportPage } from './pages/public/PublicReportPage';
import { PublicReportsPage } from './pages/public/PublicReportsPage';
import { PublicReportDetailPage } from './pages/public/PublicReportDetailPage';
import { PublicTrackPage } from './pages/public/PublicTrackPage';
import { PublicIncidentDetailPage } from './pages/public/PublicIncidentDetailPage';
import { PublicMapPage } from './pages/public/PublicMapPage';
import { AboutPage } from './pages/public/AboutPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { FAQPage } from './pages/public/FAQPage';

// Admin / Operations Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentExplorerPage } from './pages/IncidentExplorerPage';
import { IncidentDetailsPage } from './pages/IncidentDetailsPage';
import { ReportsManagementPage } from './pages/ReportsManagementPage';
import { AdminReportDetailPage } from './pages/admin/AdminReportDetailPage';
import { MapExplorerPage } from './pages/MapExplorerPage';
import { ReviewCentrePage } from './pages/ReviewCentrePage';
import { AdminConflictsPage } from './pages/admin/AdminConflictsPage';
import { DatasetManagementPage } from './pages/admin/DatasetManagementPage';
import { SyntheticDataPage } from './pages/admin/SyntheticDataPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

// Security Guard
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Routes>
          {/* =========================================
              PUBLIC CITIZEN & RESEARCH PORTAL
              ========================================= */}
          <Route path="/" element={<PublicLayout><PublicLandingPage /></PublicLayout>} />
          <Route path="/explore" element={<PublicLayout><PublicExplorerPage /></PublicLayout>} />
          <Route path="/incidents" element={<PublicLayout><PublicExplorerPage /></PublicLayout>} />
          <Route path="/incident/:id" element={<PublicLayout><PublicIncidentDetailPage /></PublicLayout>} />
          <Route path="/incidents/:id" element={<PublicLayout><PublicIncidentDetailPage /></PublicLayout>} />
          <Route path="/reports" element={<PublicLayout><PublicReportsPage /></PublicLayout>} />
          <Route path="/reports/:id" element={<PublicLayout><PublicReportDetailPage /></PublicLayout>} />
          <Route path="/report" element={<PublicLayout><PublicReportPage /></PublicLayout>} />
          <Route path="/submit-report" element={<PublicLayout><PublicReportPage /></PublicLayout>} />
          <Route path="/map" element={<PublicLayout><PublicMapPage /></PublicLayout>} />
          <Route path="/track" element={<PublicLayout><PublicTrackPage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
          <Route path="/how-it-works" element={<PublicLayout><HowItWorksPage /></PublicLayout>} />
          <Route path="/faq" element={<PublicLayout><FAQPage /></PublicLayout>} />

          {/* =========================================
              ADMIN LOGIN (Unauthenticated Entry URL)
              ========================================= */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* =========================================
              ADMIN & OPERATIONS WORKSPACE (Protected)
              ========================================= */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Navigate to="/admin/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminLayout><DashboardPage /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/incidents"
            element={
              <ProtectedRoute>
                <AdminLayout><IncidentExplorerPage /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/incidents/:incidentId"
            element={
              <ProtectedRoute>
                <AdminLayout><IncidentDetailsPage /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <AdminLayout><ReportsManagementPage /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports/:reportId"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminReportDetailPage /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/map"
            element={
              <ProtectedRoute>
                <AdminLayout><MapExplorerPage /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute>
                <AdminLayout><ReviewCentrePage /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reconciliation"
            element={
              <ProtectedRoute>
                <AdminLayout><ReviewCentrePage /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/conflicts"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminConflictsPage /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/datasets"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout><DatasetManagementPage /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/synthetic-data"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout><SyntheticDataPage /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout><UserManagementPage /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout><AuditLogsPage /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminLayout><SettingsPage /></AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
