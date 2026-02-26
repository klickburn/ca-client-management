import { useAuth } from './useAuth';
import { hasPermission } from '@/lib/permissions';

export function usePermission(action) {
  const { user } = useAuth();
  if (!user) return false;
  return hasPermission(user.role, action);
}
