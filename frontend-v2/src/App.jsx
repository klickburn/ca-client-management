import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoginPage from '@/components/auth/LoginPage';
import AppShell from '@/components/layout/AppShell';
import DashboardPage from '@/components/dashboard/DashboardPage';
import ClientsPage from '@/components/clients/ClientsPage';
import ClientDetailPage from '@/components/clients/ClientDetailPage';
import ClientFormPage from '@/components/clients/ClientFormPage';
import TasksPage from '@/components/tasks/TasksPage';
import BillingPage from '@/components/billing/BillingPage';
import ActivityPage from '@/components/activity/ActivityPage';
import ReportsPage from '@/components/reports/ReportsPage';
import TeamPage from '@/components/users/TeamPage';
import SettingsPage from '@/components/settings/SettingsPage';
import CompliancePage from '@/components/compliance/CompliancePage';
import DSCPage from '@/components/dsc/DSCPage';
import ClientPortal from '@/components/portal/ClientPortal';
import MyFilings from '@/components/portal/MyFilings';
import PortalDocuments from '@/components/portal/PortalDocuments';
import Messages from '@/components/portal/Messages';
import RoleRoute from '@/components/auth/RoleRoute';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              {/* Staff-only routes */}
              <Route element={<RoleRoute blocked={['client']} />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/clients/new" element={<ClientFormPage />} />
                <Route path="/clients/:id" element={<ClientDetailPage />} />
                <Route path="/clients/:id/edit" element={<ClientFormPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/compliance" element={<CompliancePage />} />
                <Route path="/dsc" element={<DSCPage />} />
                <Route path="/team" element={<TeamPage />} />
              </Route>

              {/* Client portal routes */}
              <Route element={<RoleRoute allowed={['client']} />}>
                <Route path="/portal" element={<ClientPortal />} />
                <Route path="/portal/filings" element={<MyFilings />} />
                <Route path="/portal/documents" element={<PortalDocuments />} />
                <Route path="/portal/messages" element={<Messages />} />
                <Route path="/portal/billing" element={<BillingPage />} />
              </Route>

              {/* Shared routes */}
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
