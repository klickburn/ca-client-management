import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoginPage from '@/components/auth/LoginPage';
import AppShell from '@/components/layout/AppShell';
import RoleRoute from '@/components/auth/RoleRoute';

// Lazy-loaded routes for code splitting
const DashboardPage = lazy(() => import('@/components/dashboard/DashboardPage'));
const ClientsPage = lazy(() => import('@/components/clients/ClientsPage'));
const ClientDetailPage = lazy(() => import('@/components/clients/ClientDetailPage'));
const ClientFormPage = lazy(() => import('@/components/clients/ClientFormPage'));
const TasksPage = lazy(() => import('@/components/tasks/TasksPage'));
const BillingPage = lazy(() => import('@/components/billing/BillingPage'));
const ActivityPage = lazy(() => import('@/components/activity/ActivityPage'));
const ReportsPage = lazy(() => import('@/components/reports/ReportsPage'));
const TeamPage = lazy(() => import('@/components/users/TeamPage'));
const SettingsPage = lazy(() => import('@/components/settings/SettingsPage'));
const CompliancePage = lazy(() => import('@/components/compliance/CompliancePage'));
const DSCPage = lazy(() => import('@/components/dsc/DSCPage'));
const ClientPortal = lazy(() => import('@/components/portal/ClientPortal'));
const MyFilings = lazy(() => import('@/components/portal/MyFilings'));
const PortalDocuments = lazy(() => import('@/components/portal/PortalDocuments'));
const Messages = lazy(() => import('@/components/portal/Messages'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
        <Toaster position="bottom-right" richColors closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}
