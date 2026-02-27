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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/new" element={<ClientFormPage />} />
              <Route path="/clients/:id" element={<ClientDetailPage />} />
              <Route path="/clients/:id/edit" element={<ClientFormPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/compliance" element={<CompliancePage />} />
              <Route path="/dsc" element={<DSCPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
