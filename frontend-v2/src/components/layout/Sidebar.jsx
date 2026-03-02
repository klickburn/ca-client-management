import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { ROLE_LABELS } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  LayoutDashboard, Users, ListTodo, IndianRupee, Activity, BarChart3,
  Settings, UserCircle, Calendar, KeyRound, Home, FileText, FolderOpen,
  MessageSquare, PanelLeftClose, PanelLeft,
} from 'lucide-react';

const navItemBase = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors';
const navItemClass = ({ isActive }) =>
  `${navItemBase} ${isActive
    ? 'bg-primary/15 text-white border-l-2 border-primary ml-[-1px]'
    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white'
  }`;
const navItemCollapsed = ({ isActive }) =>
  `flex items-center justify-center p-2.5 rounded-lg transition-colors ${isActive
    ? 'bg-primary/15 text-white'
    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white'
  }`;

function NavItem({ to, icon: Icon, label, collapsed, end }) {
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink to={to} end={end} className={navItemCollapsed}>
            <Icon size={18} />
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <NavLink to={to} end={end} className={navItemClass}>
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

function SectionLabel({ label, collapsed }) {
  if (collapsed) return <div className="h-px bg-sidebar-border my-2 mx-2" />;
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pt-4 pb-1">
      {label}
    </p>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const isClient = user?.role === 'client';

  return (
    <TooltipProvider delayDuration={200}>
      <aside className={`fixed left-0 top-0 bottom-0 ${collapsed ? 'w-16' : 'w-60'} bg-sidebar flex flex-col z-20 transition-all duration-200`}>
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-5'} py-5`}>
          <img src="/ca-logo.png" alt="Jain Lukkad & Associates" className="h-9 w-auto shrink-0" />
          {!collapsed && <span className="text-white font-semibold text-sm leading-tight">Jain Lukkad<br />&amp; Associates</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {isClient ? <ClientNav collapsed={collapsed} /> : <StaffNav collapsed={collapsed} />}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="flex items-center justify-center py-2 text-muted-foreground hover:text-white transition-colors border-t border-sidebar-border"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>

        {/* User info at bottom */}
        <div className={`${collapsed ? 'px-2' : 'px-4'} py-4 border-t border-sidebar-border`}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 mx-auto rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {user?.username} ({ROLE_LABELS[user?.role] || user?.role})
              </TooltipContent>
            </Tooltip>
          ) : (
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
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

function ClientNav({ collapsed }) {
  return (
    <>
      <NavItem to="/portal" end icon={Home} label="Portal" collapsed={collapsed} />
      <NavItem to="/portal/filings" icon={FileText} label="My Filings" collapsed={collapsed} />
      <NavItem to="/portal/documents" icon={FolderOpen} label="Documents" collapsed={collapsed} />
      <NavItem to="/portal/messages" icon={MessageSquare} label="Messages" collapsed={collapsed} />
      <NavItem to="/portal/billing" icon={IndianRupee} label="Billing" collapsed={collapsed} />
      <SectionLabel label="Account" collapsed={collapsed} />
      <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
    </>
  );
}

function StaffNav({ collapsed }) {
  const canViewDashboard = usePermission('dashboard:full') || usePermission('dashboard:limited');
  const canManageTeam = usePermission('team:manage');
  const canManageSettings = usePermission('settings:firm');
  const canViewActivity = usePermission('activity:view');
  const canViewBillingAll = usePermission('billing:viewAll');
  const canViewBillingOwn = usePermission('billing:viewOwn');
  const canViewReports = usePermission('reports:view');

  return (
    <>
      {/* Overview */}
      <SectionLabel label="Overview" collapsed={collapsed} />
      {canViewDashboard && (
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
      )}

      {/* Work */}
      <SectionLabel label="Work" collapsed={collapsed} />
      <NavItem to="/clients" icon={Users} label="Clients" collapsed={collapsed} />
      <NavItem to="/tasks" icon={ListTodo} label="Tasks" collapsed={collapsed} />
      <NavItem to="/compliance" icon={Calendar} label="Compliance" collapsed={collapsed} />
      <NavItem to="/dsc" icon={KeyRound} label="DSC Tracker" collapsed={collapsed} />

      {/* Finance */}
      {(canViewBillingAll || canViewBillingOwn) && (
        <>
          <SectionLabel label="Finance" collapsed={collapsed} />
          <NavItem to="/billing" icon={IndianRupee} label="Billing" collapsed={collapsed} />
          {canViewReports && (
            <NavItem to="/reports" icon={BarChart3} label="Reports" collapsed={collapsed} />
          )}
        </>
      )}

      {/* Admin */}
      {(canViewActivity || canManageTeam || canManageSettings) && (
        <>
          <SectionLabel label="Admin" collapsed={collapsed} />
          {canViewActivity && (
            <NavItem to="/activity" icon={Activity} label="Activity" collapsed={collapsed} />
          )}
          {canManageTeam && (
            <NavItem to="/team" icon={UserCircle} label="Team" collapsed={collapsed} />
          )}
          {canManageSettings && (
            <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
          )}
        </>
      )}
    </>
  );
}
