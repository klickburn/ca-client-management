import { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, FileText, ListTodo, IndianRupee, AlertTriangle,
  Clock, TrendingUp, BarChart3,
} from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await reportService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  if (loading) return <div className="text-muted-foreground">Loading reports...</div>;
  if (!stats) return <div className="text-muted-foreground">Failed to load reports</div>;

  const { overview, tasksByStatus, overdueTasks, tasksDueSoon, revenueStats, clientsByType, monthlyRevenue, tasksByType, workloadPerUser } = stats;

  const totalRevenue = Object.values(revenueStats).reduce((s, r) => s + (r.paid || 0), 0);
  const pendingRevenue = Object.values(revenueStats).reduce((s, r) => s + (r.total - r.paid), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Clients', value: overview.totalClients, icon: Users, color: 'text-blue-400' },
          { label: 'Team', value: overview.totalUsers, icon: Users, color: 'text-purple-400' },
          { label: 'Tasks', value: overview.totalTasks, icon: ListTodo, color: 'text-orange-400' },
          { label: 'Invoices', value: overview.totalInvoices, icon: FileText, color: 'text-green-400' },
          { label: 'Documents', value: overview.totalDocuments, icon: FileText, color: 'text-cyan-400' },
        ].map((item) => (
          <Card key={item.label} className="border-0 bg-card">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <item.icon size={14} className={item.color} />
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
              <p className="text-2xl font-bold text-white">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Summary */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee size={16} className="text-primary" /> Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Collected</p>
                <p className="text-xl font-bold text-green-500">{formatCurrency(totalRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-yellow-500">{formatCurrency(pendingRevenue)}</p>
              </div>
            </div>
            {monthlyRevenue.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Monthly Revenue (Last 6 months)</p>
                {monthlyRevenue.map((m) => {
                  const maxRevenue = Math.max(...monthlyRevenue.map(r => r.revenue));
                  const width = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={m._id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16">{m._id}</span>
                      <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                        <div className="bg-primary h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max(width, 8)}%` }}>
                          <span className="text-[10px] font-medium text-primary-foreground whitespace-nowrap">
                            {formatCurrency(m.revenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Overview */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo size={16} className="text-primary" /> Tasks Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-xl font-bold text-red-500">{overdueTasks}</p>
                <p className="text-[10px] text-muted-foreground">Overdue</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-orange-500">{tasksDueSoon}</p>
                <p className="text-[10px] text-muted-foreground">Due This Week</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-500">{tasksByStatus.completed || 0}</p>
                <p className="text-[10px] text-muted-foreground">Completed</p>
              </div>
            </div>

            {tasksByType.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Tasks by Type</p>
                {tasksByType.map((t) => (
                  <div key={t._id} className="flex items-center justify-between py-1">
                    <span className="text-sm text-white">{t._id}</span>
                    <Badge variant="secondary" className="text-xs">{t.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clients by Type */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" /> Clients by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientsByType.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-2">
                {clientsByType.map((c) => {
                  const total = clientsByType.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? ((c.count / total) * 100).toFixed(0) : 0;
                  return (
                    <div key={c._id} className="flex items-center gap-3">
                      <span className="text-sm text-white w-24 truncate">{c._id || 'Unknown'}</span>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div className="bg-primary/60 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">{c.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Workload */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> Team Workload
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workloadPerUser.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open tasks assigned</p>
            ) : (
              <div className="space-y-2">
                {workloadPerUser.map((w) => {
                  const maxCount = Math.max(...workloadPerUser.map(x => x.count));
                  const pct = maxCount > 0 ? (w.count / maxCount) * 100 : 0;
                  return (
                    <div key={w._id} className="flex items-center gap-3">
                      <span className="text-sm text-white w-28 truncate">{w.username}</span>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div className="bg-blue-500/60 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{w.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
