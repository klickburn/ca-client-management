import { useState, useEffect } from 'react';
import { complianceService } from '@/services/complianceService';
import { usePermission } from '@/hooks/usePermission';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar, Zap, Bell, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const FISCAL_YEARS = ['2025-2026', '2024-2025', '2023-2024'];
const MONTHS = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TASK_TYPES = ['All', 'ITR Filing', 'GST Filing', 'TDS Return', 'Audit', 'ROC Filing', 'Tax Planning'];

export default function CompliancePage() {
  const [calendar, setCalendar] = useState(null);
  const [fiscalYear, setFiscalYear] = useState('2025-2026');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [generating, setGenerating] = useState(false);
  const [alerting, setAlerting] = useState(false);
  const [result, setResult] = useState('');
  const canGenerate = usePermission('task:create');
  const canAlert = usePermission('dashboard:full');

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
    if (!confirm('This will auto-create compliance tasks for ALL clients based on their services. Continue?')) return;
    setGenerating(true);
    setResult('');
    try {
      const data = await complianceService.generateTasks(fiscalYear);
      setResult(data.message);
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

  const now = new Date();

  const filtered = calendar?.deadlines?.filter(d => {
    if (filterType !== 'All' && d.taskType !== filterType) return false;
    if (filterMonth !== 'All') {
      const monthIndex = MONTHS.indexOf(filterMonth) - 1; // -1 because 'All' is index 0
      const deadlineMonth = new Date(d.date).getMonth();
      if (deadlineMonth !== monthIndex) return false;
    }
    return true;
  }) || [];

  // Group by month
  const grouped = {};
  filtered.forEach(d => {
    const key = new Date(d.date).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  });

  const getStatusIcon = (dateStr) => {
    const date = new Date(dateStr);
    if (date < now) return <CheckCircle2 size={14} className="text-muted-foreground" />;
    const daysUntil = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 3) return <AlertTriangle size={14} className="text-red-500" />;
    if (daysUntil <= 7) return <Clock size={14} className="text-yellow-500" />;
    return <Clock size={14} className="text-muted-foreground" />;
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
            Statutory deadlines for FY {fiscalYear} ({filtered.length} deadlines)
          </p>
        </div>
        <div className="flex gap-2">
          {canGenerate && (
            <Button onClick={handleGenerateTasks} disabled={generating} size="sm">
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
        <div className="bg-primary/10 text-primary text-sm px-4 py-2 rounded-lg">{result}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Calendar Grid */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No deadlines match your filters</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, deadlines]) => (
            <Card key={month} className="border-0 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{month}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {deadlines.map((d, i) => {
                    const date = new Date(d.date);
                    const isPast = date < now;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 py-2.5 px-3 rounded-lg ${isPast ? 'opacity-50' : 'hover:bg-muted/50'} transition-colors`}
                      >
                        {getStatusIcon(d.date)}
                        <span className="text-xs text-muted-foreground w-16 shrink-0">
                          {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="text-sm text-white flex-1">{d.title}</span>
                        <Badge variant="secondary" className="text-[10px]">{d.taskType}</Badge>
                        <Badge className={`text-[10px] border-0 ${getPriorityColor(d.priority)}`}>{d.priority}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
