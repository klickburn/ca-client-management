import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function RoleRoute({ allowed, blocked }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // If specific roles are allowed, check membership
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to={user.role === 'client' ? '/portal' : '/dashboard'} replace />;
  }

  // If specific roles are blocked, check exclusion
  if (blocked && blocked.includes(user.role)) {
    return <Navigate to={user.role === 'client' ? '/portal' : '/dashboard'} replace />;
  }

  return <Outlet />;
}
