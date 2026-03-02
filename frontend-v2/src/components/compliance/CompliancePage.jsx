import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { complianceService } from '@/services/complianceService';
import { taskService } from '@/services/taskService';
import { usePermission } from '@/hooks/usePermission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Calendar, Zap, Bell, CheckCircle2, Clock, AlertTriangle, Search, X, ChevronDown } from 'lucide-react';

const MONTHS = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Generate fiscal years dynamically: current FY + 3 previous
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

export default function CompliancePage() {
  const [calendar, setCalendar] = useState(null);
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [alerting, setAlerting] = useState(false);
  const [result, setResult] = useState('');
  const [genSummary, setGenSummary] = useState(null);
  const [collapsedMonths, setCollapsedMonths] = useState(new Set());
  const canGenerate = usePermission('task:create');
  const canAlert = usePermission('dashboard:full');
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  // Dynamic enums + fiscal years
  const [enums, setEnums] = useState(null);
  const FISCAL_YEARS = useMemo(() => generateFiscalYears(), []);
  const [fiscalYear, setFiscalYear] = useState(FISCAL_YEARS[0]);
  const TASK_TYPES = useMemo(() => {
    const types = enums?.TASK_TYPES || ['ITR Filing', 'GST Filing', 'TDS Return', 'Audit', 'ROC Filing', 'Tax Planning', 'Bookkeeping'];
    return ['All', ...types.filter(t => t !== 'Other')];
  }, [enums]);

  useEffect(() => {
    taskService.getEnums().then(setEnums).catch(() => {});
  }, []);

  useEffect(() => {
    fetchCalendar();
  }, [fiscalYear]);

  const fetchCalendar = async () => {
    try {
      const data = await complianceService.getCalendar(fiscalYear);
      setCalendar(data);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    }
  };

  const handleGenerateTasks = async () => {
    setGenerating(true);
    setResult('');
    setGenSummary(null);
    try {
      const data = await complianceService.generateTasks(fiscalYear);
      setResult(data.message);
      if (data.clients && data.clients.length > 0) {
        setGenSummary(data);
      }
    } catch (error) {
      setResult('Error generating tasks');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendAlerts = async () => {
    setAlerting(true);
    setResult('');
    try {
      const data = await complianceService.sendDeadlineAlerts();
      setResult(data.message);
    } catch (error) {
      setResult('Error sending alerts');
    } finally {
      setAlerting(false);
    }
  };

  const clearFilters = () => {
    setFilterMonth('All');
    setFilterType('All');
    setSearchQuery('');
  };

  const hasActiveFilters = filterMonth !== 'All' || filterType !== 'All' || searchQuery;

  const toggleMonthCollapse = (month) => {
    setCollapsedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  const now = new Date();

  const filtered = useMemo(() => {
    return calendar?.deadlines?.filter(d => {
      if (filterType !== 'All' && d.taskType !== filterType) return false;
      if (filterMonth !== 'All') {
        const monthIndex = MONTHS.indexOf(filterMonth) - 1;
        const deadlineMonth = new Date(d.date).getMonth();
        if (deadlineMonth !== monthIndex) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!d.title.toLowerCase().includes(q) && !d.taskType.toLowerCase().includes(q)) return false;
      }
      return true;
    }) || [];
  }, [calendar, filterType, filterMonth, searchQuery]);

  // Group by month
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(d => {
      const key = new Date(d.date).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return groups;
  }, [filtered]);

  // Count upcoming vs past deadlines
  const upcomingCount = filtered.filter(d => new Date(d.date) >= now).length;
  const pastCount = filtered.filter(d => new Date(d.date) < now).length;

  const getStatusIcon = (dateStr) => {
    const date = new Date(dateStr);
    if (date < now) return <CheckCircle2 size={14} className="text-muted-foreground" />;
    const daysUntil = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 3) return <AlertTriangle size={14} className="text-red-500" />;
    if (daysUntil <= 7) return <Clock size={14} className="text-yellow-500" />;
    return <Clock size={14} className="text-muted-foreground" />;
  };

  const getRelativeLabel = (dateStr) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((date - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return null; // past — shown differently
    if (diffDays === 0) return { text: 'Today', className: 'text-orange-400' };
    if (diffDays === 1) return { text: 'Tomorrow', className: 'text-orange-400' };
    if (diffDays <= 7) return { text: `${diffDays}d left`, className: 'text-yellow-400' };
    return null;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar size={24} /> Compliance Calendar
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            FY {fiscalYear} — {upcomingCount} upcoming, {pastCount} past ({filtered.length} total)
          </p>
        </div>
        <div className="flex gap-2">
          {canGenerate && (
            <Button onClick={() => setShowGenerateConfirm(true)} disabled={generating} size="sm">
              <Zap size={14} className="mr-1" />
              {generating ? 'Generating...' : 'Auto-Generate Tasks'}
            </Button>
          )}
          {canAlert && (
            <Button onClick={handleSendAlerts} disabled={alerting} variant="outline" size="sm">
              <Bell size={14} className="mr-1" />
              {alerting ? 'Sending...' : 'Send Alerts'}
            </Button>
          )}
        </div>
      </div>

      {result && (
        <div className="flex items-center justify-between bg-primary/10 text-primary text-sm px-4 py-2 rounded-lg">
          <span>{result}</span>
          <button onClick={() => setResult('')} className="text-primary/60 hover:text-primary ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {genSummary && (
        <Card className="border-0 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Generation Summary</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setGenSummary(null)}>Dismiss</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-3 text-xs">
              <span className="text-green-500">{genSummary.created} created</span>
              <span className="text-yellow-500">{genSummary.skipped} skipped (duplicates)</span>
              <span className="text-blue-500">{genSummary.filingsCreated} filings</span>
              {genSummary.errors > 0 && <span className="text-red-500">{genSummary.errors} errors</span>}
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {genSummary.clients.map((c) => (
                <div key={c.clientId} className="text-xs py-1.5 px-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-white flex-1 truncate">{c.clientName}</span>
                    {c.tasksCreated > 0 && <Badge variant="secondary" className="text-[10px]">+{c.tasksCreated} new</Badge>}
                    {c.tasksSkipped > 0 && <span className="text-muted-foreground">{c.tasksSkipped} existing</span>}
                    {c.errors.length > 0 && <span className="text-red-500">{c.errors.length} failed</span>}
                  </div>
                  {c.errors.length > 0 && (
                    <div className="mt-1 space-y-0.5 pl-2 border-l border-red-500/30">
                      {c.errors.map((err, i) => (
                        <p key={i} className="text-red-400">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={fiscalYear} onValueChange={setFiscalYear}>
          <SelectTrigger className="w-36 bg-secondary border-0 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FISCAL_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-36 bg-secondary border-0 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 bg-secondary border-0 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TASK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deadlines..."
            className="w-48 bg-secondary border-0 h-9 text-xs pl-8"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground" onClick={clearFilters}>
            <X size={13} className="mr-1" />Clear
          </Button>
        )}
      </div>

      {/* Calendar Grid */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {hasActiveFilters ? 'No deadlines match your filters. Try adjusting your criteria.' : 'No deadlines found for this fiscal year.'}
          </p>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={clearFilters}>Clear filters</Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, deadlines]) => {
            const isCollapsed = collapsedMonths.has(month);
            const monthPastCount = deadlines.filter(d => new Date(d.date) < now).length;
            const monthUpcoming = deadlines.length - monthPastCount;

            return (
              <Card key={month} className="border-0 bg-card">
                <CardHeader className="pb-2">
                  <button
                    onClick={() => toggleMonthCollapse(month)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                      <CardTitle className="text-sm text-muted-foreground">{month}</CardTitle>
                    </div>
                    <div className="flex gap-2 text-[10px]">
                      {monthUpcoming > 0 && <span className="text-blue-400">{monthUpcoming} upcoming</span>}
                      {monthPastCount > 0 && <span className="text-muted-foreground">{monthPastCount} past</span>}
                    </div>
                  </button>
                </CardHeader>
                {!isCollapsed && (
                  <CardContent>
                    <div className="space-y-1">
                      {deadlines.map((d, i) => {
                        const date = new Date(d.date);
                        const isPast = date < now;
                        const relLabel = getRelativeLabel(d.date);
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${isPast ? 'opacity-40' : 'hover:bg-muted/50'}`}
                          >
                            {getStatusIcon(d.date)}
                            <span className="text-xs text-muted-foreground w-16 shrink-0">
                              {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-sm text-white flex-1">{d.title}</span>
                            {isPast && (
                              <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-0">Past</Badge>
                            )}
                            {relLabel && (
                              <span className={`text-[10px] font-medium ${relLabel.className}`}>{relLabel.text}</span>
                            )}
                            <Badge variant="secondary" className="text-[10px]">{d.taskType}</Badge>
                            <Badge className={`text-[10px] border-0 ${getPriorityColor(d.priority)}`}>{d.priority}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={showGenerateConfirm}
        onOpenChange={setShowGenerateConfirm}
        title="Generate compliance tasks"
        description="This will auto-create compliance tasks for ALL clients based on their services. Continue?"
        confirmLabel="Generate"
        variant="default"
        onConfirm={handleGenerateTasks}
      />
    </div>
  );
}
