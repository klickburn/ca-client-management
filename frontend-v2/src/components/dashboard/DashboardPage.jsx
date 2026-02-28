import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { clientService } from '@/services/clientService';
import { userService } from '@/services/userService';
import { taskService } from '@/services/taskService';
import { invoiceService } from '@/services/invoiceService';
import { activityService } from '@/services/activityService';
import { documentService } from '@/services/documentService';
import StatCard from './StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, UserCircle, ListTodo, IndianRupee,
  AlertTriangle, Clock, CheckCircle2, Activity,
  FileCheck, CheckCircle, XCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canViewFull = usePermission('dashboard:full');
  const canManageTeam = usePermission('team:manage');
  const canViewActivity = usePermission('activity:view');
  const canVerifyDocs = usePermission('document:verify');
  const [stats, setStats] = useState({ clients: 0, users: 0 });
  const [taskStats, setTaskStats] = useState({});
  const [invoiceStats, setInvoiceStats] = useState({});
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clients, tStats, iStats, tasks] = await Promise.all([
          clientService.getClients(),
          taskService.getTaskStats(),
          invoiceService.getInvoiceStats(),
          taskService.getTasks({ status: 'pending' }),
        ]);

        setStats((prev) => ({ ...prev, clients: clients.length }));
        setTaskStats(tStats);
        setInvoiceStats(iStats);
        setRecentTasks(tasks.slice(0, 5));

        if (canManageTeam) {
          const users = await userService.getUsers();
          setStats((prev) => ({ ...prev, users: users.length }));
        }

        if (canViewActivity) {
          const activities = await activityService.getActivities({ limit: 8 });
          setRecentActivity(activities);
        }

        if (canVerifyDocs) {
          const pending = await documentService.getPendingDocuments();
          setPendingDocs(pending);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, [canManageTeam, canViewActivity, canVerifyDocs]);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleApproveDoc = async (doc) => {
    try {
      await documentService.verifyDocument(doc.clientId, doc.documentId);
      setPendingDocs((prev) => prev.filter((d) => d.documentId !== doc.documentId));
    } catch (error) {
      console.error('Error approving document:', error);
    }
  };

  const handleRejectDoc = async (doc) => {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await documentService.rejectDocument(doc.clientId, doc.documentId, reason);
      setPendingDocs((prev) => prev.filter((d) => d.documentId !== doc.documentId));
    } catch (error) {
      console.error('Error rejecting document:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.username}. Jain Lukkad & Associates
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={canViewFull ? 'Total Clients' : 'Your Clients'} value={stats.clients} icon={Users} />
        {canManageTeam && (
          <StatCard title="Team Members" value={stats.users} icon={UserCircle} />
        )}
        <StatCard title="Open Tasks" value={(taskStats.pending || 0) + (taskStats.in_progress || 0)} icon={ListTodo} />
        {canVerifyDocs && pendingDocs.length > 0 && (
          <StatCard title="Docs to Review" value={pendingDocs.length} icon={FileCheck} />
        )}
        {(taskStats.overdue || 0) > 0 && (
          <StatCard title="Overdue" value={taskStats.overdue} icon={AlertTriangle} />
        )}
      </div>

      {/* Task & Revenue Row */}
      {canViewFull && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 bg-card cursor-pointer hover:bg-secondary transition-colors" onClick={() => navigate('/tasks')}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Due This Week</p>
              <p className="text-xl font-bold text-orange-500">{taskStats.dueSoon || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card cursor-pointer hover:bg-secondary transition-colors" onClick={() => navigate('/tasks')}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Completed Tasks</p>
              <p className="text-xl font-bold text-green-500">{taskStats.completed || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card cursor-pointer hover:bg-secondary transition-colors" onClick={() => navigate('/billing')}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-xl font-bold text-green-500">{formatCurrency(invoiceStats.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card cursor-pointer hover:bg-secondary transition-colors" onClick={() => navigate('/billing')}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Pending Payments</p>
              <p className="text-xl font-bold text-yellow-500">{formatCurrency(invoiceStats.pendingRevenue)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Document Approvals */}
      {canVerifyDocs && pendingDocs.length > 0 && (
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck size={16} className="text-yellow-500" />
                Pending Document Approvals ({pendingDocs.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingDocs.slice(0, 10).map((doc) => (
                <div key={doc.documentId} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.clientName} &middot; {doc.category} &middot; by {doc.uploadedBy} &middot; {timeAgo(doc.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:text-green-400 hover:bg-green-500/10" onClick={() => handleApproveDoc(doc)}>
                      <CheckCircle size={15} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleRejectDoc(doc)}>
                      <XCircle size={15} />
                    </Button>
                  </div>
                </div>
              ))}
              {pendingDocs.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{pendingDocs.length - 10} more documents pending review
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Tasks */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Tasks</CardTitle>
              <button onClick={() => navigate('/tasks')} className="text-xs text-primary hover:underline">View all</button>
            </div>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending tasks</p>
            ) : (
              <div className="space-y-2">
                {recentTasks.map((task) => {
                  const overdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();
                  return (
                    <div key={task._id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50">
                      {overdue ? (
                        <AlertTriangle size={14} className="text-red-500 shrink-0" />
                      ) : (
                        <Clock size={14} className="text-yellow-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.client?.name} - Due {new Date(task.dueDate).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{task.taskType}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {canViewActivity && (
          <Card className="border-0 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <button onClick={() => navigate('/activity')} className="text-xs text-primary hover:underline">View all</button>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((a) => (
                    <div key={a._id} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/50">
                      <Activity size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{a.details}</p>
                        <p className="text-xs text-muted-foreground">{a.performedBy?.username} - {timeAgo(a.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
