import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/notificationService';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { LogOut, Bell, CheckCheck, Menu } from 'lucide-react';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clients',
  '/clients/new': 'New Client',
  '/tasks': 'Tasks',
  '/billing': 'Billing',
  '/activity': 'Activity Log',
  '/compliance': 'Compliance',
  '/dsc': 'DSC Tracker',
  '/reports': 'Reports & Analytics',
  '/team': 'Team',
  '/settings': 'Settings',
  '/portal': 'Portal',
  '/portal/filings': 'My Filings',
  '/portal/documents': 'Documents',
  '/portal/messages': 'Messages',
  '/portal/billing': 'Billing',
};

function getPageTitle(pathname) {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Client detail/edit pages
  if (/^\/clients\/[^/]+\/edit$/.test(pathname)) return 'Edit Client';
  if (/^\/clients\/[^/]+$/.test(pathname)) return 'Client Details';
  return '';
}

export default function Header({ onMenuToggle }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      // Silently fail
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleOpen = (isOpen) => {
    setOpen(isOpen);
    if (isOpen) fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  };

  const handleClick = async (notification) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification._id);
      setUnreadCount(Math.max(0, unreadCount - 1));
    }
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="h-14 bg-background border-b border-border flex items-center justify-between px-6">
        {/* Left side: mobile menu + page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden text-muted-foreground hover:text-white p-1"
          >
            <Menu size={20} />
          </button>
          {pageTitle && (
            <h2 className="text-sm font-medium text-white">{pageTitle}</h2>
          )}
        </div>

        {/* Right side: notifications + sign out */}
        <div className="flex items-center gap-2">
          <DropdownMenu open={open} onOpenChange={handleOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-white">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <span className="text-sm font-medium text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-sm text-muted-foreground">No notifications</p>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <button
                      key={n._id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border/50 ${!n.read ? 'bg-muted/30' : ''}`}
                    >
                      <p className={`text-sm ${!n.read ? 'text-white font-medium' : 'text-muted-foreground'}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                    </button>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="border-t border-border px-4 py-2 text-center">
                  <button
                    onClick={() => { setOpen(false); navigate('/activity'); }}
                    className="text-xs text-primary hover:underline"
                  >
                    View all activity
                  </button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogoutConfirm(true)}
            className="text-muted-foreground hover:text-white"
          >
            <LogOut size={16} className="mr-2" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Sign out confirmation */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign out</DialogTitle>
            <DialogDescription>Are you sure you want to sign out?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleLogout}>Sign out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
