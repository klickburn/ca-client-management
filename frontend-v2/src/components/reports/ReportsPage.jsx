import { useState, useEffect, useMemo, useCallback } from 'react';
import { reportService } from '@/services/reportService';
import { taskService } from '@/services/taskService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Users, FileText, ListTodo, IndianRupee, AlertTriangle,
  Clock, TrendingUp, BarChart3, Download, RefreshCw,
  ShieldCheck, FileCheck, Key, Activity, CheckCircle2, X,
} from 'lucide-react';

function generateFiscalYears() {
  const now = new Date();
  const year = now.getFullYear();
  const currentFYStart = now.getMonth() >= 3 ? year : year - 1;
  const years = [];
  for (let i = 0; i < 4; i++) {
    const start = currentFYStart - i;
    years.push(`${start}-${start + 1}`);
  }
  return years;
}

function BarRow({ label, value, maxValue, color = 'bg-primary/60', suffix = '' }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-white w-28 truncate">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
        <div className={`${color} h-full rounded-full`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-12 text-right">{value}{suffix}</span>
    </div>
  );
}

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fiscalYear, setFiscalYear] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const FISCAL_YEARS = useMemo(() => generateFiscalYears(), []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (fiscalYear) filters.fiscalYear = fiscalYear;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      const data = await reportService.getDashboardStats(filters);
      setStats(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, [fiscalYear, dateFrom, dateTo]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch enums for consistency
  const [enums, setEnums] = useState(null);
  useEffect(() => {
    taskService.getEnums().then(setEnums).catch(() => {});
  }, []);

  const clearFilters = () => {
    setFiscalYear('');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = fiscalYear || dateFrom || dateTo;

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  const exportCSV = (filename, headers, rows) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportRevenueCSV = () => {
    if (!stats) return;
    const headers = ['Month', 'Revenue'];
    const rows = stats.monthlyRevenue.map(m => [m._id, m.revenue]);
    exportCSV('monthly-revenue', headers, rows);
  };

  const exportTasksCSV = () => {
    if (!stats) return;
    const headers = ['Type', 'Count'];
    const rows = stats.tasksByType.map(t => [t._id, t.count]);
    exportCSV('tasks-by-type', headers, rows);
  };

  const exportWorkloadCSV = () => {
    if (!stats) return;
    const headers = ['User', 'Role', 'Open Tasks', 'Completed'];
    const rows = stats.workloadPerUser.map(w => {
      const perf = stats.teamPerformance?.find(p => p._id === w._id);
      return [w.username, w.role, w.count, perf?.completed || 0];
    });
    exportCSV('team-workload', headers, rows);
  };

  if (loading && !stats) return <div className="text-muted-foreground">Loading reports...</div>;
  if (!stats) return <div className="text-muted-foreground">Failed to load reports</div>;

  const {
    overview, tasksByStatus, overdueTasks, tasksDueSoon, revenueStats,
    clientsByType, monthlyRevenue, tasksByType, workloadPerUser,
    filingsByStatus, filingsByType, complianceRate, totalDue, completedOnTime,
    revenueByClient, taskCompletionTrend, overdueByType, overdueByAssignee,
    invoiceAging, invoiceAgingCount, dscSummary, recentActivity, teamPerformance,
  } = stats;

  const totalRevenue = Object.values(revenueStats).reduce((s, r) => s + (r.paid || 0), 0);
  const pendingRevenue = Object.values(revenueStats).reduce((s, r) => s + (r.total - r.paid), 0);
  const clientsTotal = clientsByType.reduce((s, x) => s + x.count, 0);
  const totalFilings = Object.values(filingsByStatus || {}).reduce((s, c) => s + c, 0);

  const filingStatusConfig = {
    not_started: { label: 'Not Started', color: 'text-muted-foreground' },
    in_progress: { label: 'In Progress', color: 'text-blue-400' },
    filed: { label: 'Filed', color: 'text-green-400' },
    verified: { label: 'Verified', color: 'text-green-500' },
    rejected: { label: 'Rejected', color: 'text-red-400' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={fiscalYear || 'all'} onValueChange={(v) => setFiscalYear(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36 bg-secondary border-0 h-8 text-xs"><SelectValue placeholder="All FY" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fiscal Years</SelectItem>
            {FISCAL_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="w-36 bg-secondary border-0 h-8 text-xs" title="From date"
        />
        <Input
          type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="w-36 bg-secondary border-0 h-8 text-xs" title="To date"
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={clearFilters}>
            <X size={13} className="mr-1" />Clear
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Clients', value: overview.totalClients, icon: Users, color: 'text-blue-400' },
          { label: 'Team', value: overview.totalUsers, icon: Users, color: 'text-purple-400' },
          { label: 'Tasks', value: overview.totalTasks, icon: ListTodo, color: 'text-orange-400' },
          { label: 'Invoices', value: overview.totalInvoices, icon: FileText, color: 'text-green-400' },
          { label: 'Documents', value: overview.totalDocuments, icon: FileText, color: 'text-cyan-400' },
          { label: 'Compliance', value: `${complianceRate}%`, icon: ShieldCheck, color: complianceRate >= 80 ? 'text-green-400' : complianceRate >= 50 ? 'text-yellow-400' : 'text-red-400' },
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

      {/* Compliance Rate Detail */}
      <Card className="border-0 bg-card">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Compliance Rate — {completedOnTime}/{totalDue} deadlines met</span>
            <span className={`text-sm font-bold ${complianceRate >= 80 ? 'text-green-400' : complianceRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{complianceRate}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${complianceRate >= 80 ? 'bg-green-500' : complianceRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${complianceRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Summary */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee size={16} className="text-primary" /> Revenue
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={exportRevenueCSV}>
                <Download size={12} className="mr-1" />CSV
              </Button>
            </div>
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
                <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                {monthlyRevenue.map((m) => {
                  const maxRevenue = Math.max(...monthlyRevenue.map(r => r.revenue));
                  const width = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={m._id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16">{m._id}</span>
                      <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                        <div className="bg-primary h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max(width, 12)}%` }}>
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo size={16} className="text-primary" /> Tasks Overview
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={exportTasksCSV}>
                <Download size={12} className="mr-1" />CSV
              </Button>
            </div>
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

        {/* Revenue by Top Clients */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee size={16} className="text-primary" /> Top Clients by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByClient?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No revenue data</p>
            ) : (
              <div className="space-y-2">
                {revenueByClient?.map((c) => {
                  const maxPaid = Math.max(...revenueByClient.map(x => x.totalPaid));
                  return (
                    <BarRow key={c._id} label={c.clientName} value={c.totalPaid} maxValue={maxPaid} color="bg-green-500/60" suffix="" />
                  );
                })}
                <p className="text-[10px] text-muted-foreground pt-1">Amounts in INR</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filing Status */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck size={16} className="text-primary" /> Filings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalFilings === 0 ? (
              <p className="text-sm text-muted-foreground">No filing data</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-3 mb-4">
                  {Object.entries(filingsByStatus || {}).map(([status, count]) => (
                    <div key={status} className="text-center">
                      <p className={`text-lg font-bold ${filingStatusConfig[status]?.color || 'text-white'}`}>{count}</p>
                      <p className="text-[10px] text-muted-foreground">{filingStatusConfig[status]?.label || status}</p>
                    </div>
                  ))}
                </div>
                {filingsByType?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">By Type (filed/total)</p>
                    {filingsByType.map((f) => (
                      <div key={f._id} className="flex items-center justify-between py-0.5">
                        <span className="text-sm text-white">{f._id}</span>
                        <span className="text-xs">
                          <span className="text-green-400">{f.filed}</span>
                          <span className="text-muted-foreground">/{f.count}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Task Completion Trend */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 size={16} className="text-primary" /> Completion Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {taskCompletionTrend?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completions in the last 6 months</p>
            ) : (
              <div className="space-y-2">
                {taskCompletionTrend?.map((m) => {
                  const maxCount = Math.max(...taskCompletionTrend.map(r => r.count));
                  const width = maxCount > 0 ? (m.count / maxCount) * 100 : 0;
                  return (
                    <div key={m._id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16">{m._id}</span>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div className="bg-green-500/60 h-full rounded-full" style={{ width: `${Math.max(width, 5)}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{m.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Aging */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock size={16} className="text-primary" /> Invoice Aging
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Current', amount: invoiceAging?.current, count: invoiceAgingCount?.current, color: 'text-green-400' },
                { label: '1-30 Days', amount: invoiceAging?.thirtyDays, count: invoiceAgingCount?.thirtyDays, color: 'text-yellow-400' },
                { label: '31-60 Days', amount: invoiceAging?.sixtyDays, count: invoiceAgingCount?.sixtyDays, color: 'text-orange-400' },
                { label: '90+ Days', amount: invoiceAging?.ninetyPlus, count: invoiceAgingCount?.ninetyPlus, color: 'text-red-400' },
              ].map((bracket) => (
                <div key={bracket.label} className="p-2 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground">{bracket.label}</p>
                  <p className={`text-base font-bold ${bracket.color}`}>{formatCurrency(bracket.amount)}</p>
                  <p className="text-[10px] text-muted-foreground">{bracket.count} invoice{bracket.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overdue Breakdown */}
        {overdueTasks > 0 && (
          <Card className="border-0 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" /> Overdue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueByType?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">By Type</p>
                  <div className="flex flex-wrap gap-2">
                    {overdueByType.map((t) => (
                      <Badge key={t._id} variant="secondary" className="text-xs bg-red-500/10 text-red-400 border-0">
                        {t._id}: {t.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {overdueByAssignee?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">By Assignee</p>
                  <div className="flex flex-wrap gap-2">
                    {overdueByAssignee.map((a) => (
                      <Badge key={a._id} variant="secondary" className="text-xs">
                        {a.username}: {a.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                  const pct = clientsTotal > 0 ? ((c.count / clientsTotal) * 100).toFixed(0) : 0;
                  return (
                    <div key={c._id} className="flex items-center gap-3">
                      <span className="text-sm text-white w-24 truncate">{c._id || 'Unknown'}</span>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div className="bg-primary/60 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">{c.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DSC Summary */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key size={16} className="text-primary" /> DSC Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-green-400">{dscSummary?.active || 0}</p>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-yellow-400">{dscSummary?.expiringSoon || 0}</p>
                <p className="text-[10px] text-muted-foreground">Expiring (30d)</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-red-400">{dscSummary?.expired || 0}</p>
                <p className="text-[10px] text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Workload + Performance */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" /> Team Workload
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={exportWorkloadCSV}>
                <Download size={12} className="mr-1" />CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {workloadPerUser.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open tasks assigned</p>
            ) : (
              <div className="space-y-2">
                {workloadPerUser.map((w) => {
                  const maxCount = Math.max(...workloadPerUser.map(x => x.count));
                  const pct = maxCount > 0 ? (w.count / maxCount) * 100 : 0;
                  const perf = teamPerformance?.find(p => p._id === w._id);
                  return (
                    <div key={w._id} className="flex items-center gap-3">
                      <div className="w-28 shrink-0">
                        <span className="text-sm text-white truncate block">{w.username}</span>
                        <span className="text-[10px] text-muted-foreground">{w.role}</span>
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div className="bg-blue-500/60 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-20 text-right shrink-0">
                        <span className="text-xs text-muted-foreground">{w.count} open</span>
                        {perf && <span className="text-[10px] text-green-400 block">{perf.completed} done</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity size={16} className="text-primary" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentActivity?.map((a) => (
                  <div key={a._id} className="flex gap-2 text-xs py-1.5 border-b border-border/50 last:border-0">
                    <div className="w-1 rounded-full bg-primary/30 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{a.details || a.action}</p>
                      <p className="text-muted-foreground">
                        {a.performedBy?.username || 'System'} &middot; {new Date(a.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
