import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { ROLE_LABELS } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  ListTodo,
  IndianRupee,
  Activity,
  BarChart3,
  Settings,
  UserCircle,
  Calendar,
  KeyRound,
} from 'lucide-react';

const navItemClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-sidebar-accent text-white border-l-2 border-primary ml-[-1px]'
      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white'
  }`;

export default function Sidebar() {
  const { user } = useAuth();
  const canViewDashboard = usePermission('dashboard:full') || usePermission('dashboard:limited');
  const canManageTeam = usePermission('team:manage');
  const canManageSettings = usePermission('settings:firm');
  const canViewActivity = usePermission('activity:view');
  const canViewBillingAll = usePermission('billing:viewAll');
  const canViewBillingOwn = usePermission('billing:viewOwn');
  const canViewReports = usePermission('dashboard:full');

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar flex flex-col z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <img src="/ca-logo.png" alt="JLA" className="h-9 w-auto shrink-0" />
        <span className="text-white font-semibold text-lg">ClientDB</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {canViewDashboard && (
          <NavLink to="/dashboard" className={navItemClass}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
        )}

        <NavLink to="/clients" className={navItemClass}>
          <Users size={18} />
          Clients
        </NavLink>

        <NavLink to="/tasks" className={navItemClass}>
          <ListTodo size={18} />
          Tasks
        </NavLink>

        {(canViewBillingAll || canViewBillingOwn) && (
          <NavLink to="/billing" className={navItemClass}>
            <IndianRupee size={18} />
            Billing
          </NavLink>
        )}

        {canViewActivity && (
          <NavLink to="/activity" className={navItemClass}>
            <Activity size={18} />
            Activity
          </NavLink>
        )}

        <NavLink to="/compliance" className={navItemClass}>
          <Calendar size={18} />
          Compliance
        </NavLink>

        <NavLink to="/dsc" className={navItemClass}>
          <KeyRound size={18} />
          DSC Tracker
        </NavLink>

        {canViewReports && (
          <NavLink to="/reports" className={navItemClass}>
            <BarChart3 size={18} />
            Reports
          </NavLink>
        )}

        {canManageTeam && (
          <NavLink to="/team" className={navItemClass}>
            <UserCircle size={18} />
            Team
          </NavLink>
        )}

        {canManageSettings && (
          <NavLink to="/settings" className={navItemClass}>
            <Settings size={18} />
            Settings
          </NavLink>
        )}
      </nav>

      {/* User info at bottom */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.username}
            </p>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/50 text-primary">
              {ROLE_LABELS[user?.role] || user?.role}
            </Badge>
          </div>
        </div>
      </div>
    </aside>
  );
}
