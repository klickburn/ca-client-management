import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect client role to portal if accessing root or dashboard
  if (user.role === 'client' && (location.pathname === '/' || location.pathname === '/dashboard')) {
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
}
