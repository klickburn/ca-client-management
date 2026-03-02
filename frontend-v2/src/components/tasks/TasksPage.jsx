import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { taskService } from '@/services/taskService';
import { clientService } from '@/services/clientService';
import { userService } from '@/services/userService';
import { activityService } from '@/services/activityService';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Plus, Calendar, Clock, AlertTriangle, CheckCircle2,
  Circle, ArrowUpCircle, Trash2, ChevronDown, CheckSquare,
  Search, Copy, History, X,
} from 'lucide-react';
import DocumentChecklist from '@/components/compliance/DocumentChecklist';

const statusConfig = {
  pending:     { label: 'Pending',     color: 'bg-yellow-500/10 text-yellow-500', icon: Circle },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-500', icon: Clock },
  review:      { label: 'Review',      color: 'bg-purple-500/10 text-purple-500', icon: ArrowUpCircle },
  completed:   { label: 'Completed',   color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
  overdue:     { label: 'Overdue',     color: 'bg-red-500/10 text-red-500', icon: AlertTriangle },
};

const priorityConfig = {
  low:    { label: 'Low',    color: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', color: 'bg-blue-500/10 text-blue-400' },
  high:   { label: 'High',   color: 'bg-orange-500/10 text-orange-400' },
  urgent: { label: 'Urgent', color: 'bg-red-500/10 text-red-400' },
};

// Generate fiscal years dynamically: current FY + 3 previous
function generateFiscalYears() {
  const now = new Date();
  const year = now.getFullYear();
  // Indian FY starts April: if month >= April, current FY is year-year+1
  const currentFYStart = now.getMonth() >= 3 ? year : year - 1;
  const years = [];
  for (let i = 0; i < 4; i++) {
    const start = currentFYStart - i;
    years.push(`${start}-${start + 1}`);
  }
  return years;
}

function getRelativeDueDate(dueDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffMs = due - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, className: 'text-red-400' };
  if (diffDays === 0) return { text: 'Due today', className: 'text-orange-400' };
  if (diffDays === 1) return { text: 'Due tomorrow', className: 'text-orange-400' };
  if (diffDays <= 7) return { text: `Due in ${diffDays}d`, className: 'text-yellow-400' };
  return { text: `Due in ${diffDays}d`, className: 'text-muted-foreground' };
}

const emptyForm = {
  title: '', description: '', client: '', taskType: 'Other',
  priority: 'medium', dueDate: '', assignedTo: '', fiscalYear: '', notes: '',
};

export default function TasksPage() {
  const { user } = useAuth();
  const canCreate = usePermission('task:create');
  const canDelete = usePermission('task:delete');
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [stats, setStats] = useState({});
  const [expandedTask, setExpandedTask] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('my');
  const [form, setForm] = useState({ ...emptyForm });
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyTaskId, setHistoryTaskId] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Dynamic enums from API
  const [enums, setEnums] = useState(null);
  const TASK_TYPES = enums?.TASK_TYPES || ['ITR Filing', 'GST Filing', 'TDS Return', 'Audit', 'ROC Filing', 'Tax Planning', 'Bookkeeping', 'Other'];
  const PRIORITIES = enums?.TASK_PRIORITIES || ['low', 'medium', 'high', 'urgent'];
  const STATUSES = enums?.TASK_STATUSES || ['pending', 'in_progress', 'review', 'completed', 'overdue'];
  const FISCAL_YEARS = useMemo(() => generateFiscalYears(), []);

  useEffect(() => {
    taskService.getEnums().then(setEnums).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterPriority, filterClient]);

  const fetchData = async () => {
    try {
      const [tasksData, statsData, clientsData] = await Promise.all([
        taskService.getTasks({
          status: filterStatus !== 'all' ? filterStatus : undefined,
          priority: filterPriority !== 'all' ? filterPriority : undefined,
          clientId: filterClient !== 'all' ? filterClient : undefined,
        }),
        taskService.getTaskStats(),
        clientService.getClients(),
      ]);
      setTasks(tasksData);
      setSelectedTasks(new Set());
      setStats(statsData);
      setClients(clientsData);

      if (user?.role === 'partner' || user?.role === 'seniorCA') {
        const usersData = await userService.getUsers();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await taskService.createTask(form);
      setDialogOpen(false);
      setForm({ ...emptyForm });
      toast.success('Task created');
      fetchData();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleDuplicate = (task) => {
    setForm({
      title: `${task.title} (Copy)`,
      description: task.description || '',
      client: task.client?._id || '',
      taskType: task.taskType || 'Other',
      priority: task.priority || 'medium',
      dueDate: '',
      assignedTo: task.assignedTo?._id || '',
      fiscalYear: task.fiscalYear || '',
      notes: task.notes || '',
    });
    setDialogOpen(true);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleAssign = async (taskId, assignedTo) => {
    try {
      await taskService.updateTask(taskId, { assignedTo: assignedTo || null });
      fetchData();
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      toast.success('Task deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    setBulkDeleting(true);
    try {
      await taskService.bulkDeleteTasks([...selectedTasks]);
      setSelectedTasks(new Set());
      toast.success(`Deleted ${selectedTasks.size} task(s)`);
      fetchData();
    } catch (error) {
      toast.error('Bulk delete failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedTasks.size === 0) return;
    setBulkUpdating(true);
    try {
      await taskService.bulkUpdateTasks([...selectedTasks], newStatus);
      setSelectedTasks(new Set());
      fetchData();
    } catch (error) {
      console.error('Bulk update failed:', error);
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleViewHistory = async (taskId) => {
    setHistoryTaskId(taskId);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    try {
      const result = await activityService.getActivities({
        targetType: 'Task',
        targetId: taskId,
        limit: 20,
      });
      setHistoryData(result.activities || result);
    } catch (error) {
      console.error('Error fetching task history:', error);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleSelect = (taskId) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === displayedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(displayedTasks.map((t) => t._id)));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterClient('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasActiveFilters = searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterClient !== 'all' || filterDateFrom || filterDateTo;

  const isStaff = user?.role === 'partner' || user?.role === 'seniorCA';

  // Filter tasks by active tab, search, and date range (status/priority/client handled by API)
  const displayedTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (isStaff) {
        if (activeTab === 'my' && task.assignedTo?._id !== user?.userId) return false;
        if (activeTab === 'unassigned' && task.assignedTo) return false;
      }
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(q);
        const matchesClient = task.client?.name?.toLowerCase().includes(q);
        const matchesType = task.taskType?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesClient && !matchesType) return false;
      }
      // Date range filter
      if (filterDateFrom && new Date(task.dueDate) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(task.dueDate) > new Date(filterDateTo)) return false;
      return true;
    });
  }, [tasks, activeTab, isStaff, user?.userId, searchQuery, filterDateFrom, filterDateTo]);

  if (loading) return <div className="text-muted-foreground">Loading tasks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tasks</h1>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-2" />New Task</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="bg-secondary border-0" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Select value={form.client} onValueChange={(v) => setForm({ ...form, client: v })}>
                      <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Select client" /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Task Type</Label>
                    <Select value={form.taskType} onValueChange={(v) => setForm({ ...form, taskType: v })}>
                      <SelectTrigger className="bg-secondary border-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                      <SelectTrigger className="bg-secondary border-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required className="bg-secondary border-0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fiscal Year</Label>
                    <Select value={form.fiscalYear} onValueChange={(v) => setForm({ ...form, fiscalYear: v })}>
                      <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Select FY" /></SelectTrigger>
                      <SelectContent>
                        {FISCAL_YEARS.map((fy) => <SelectItem key={fy} value={fy}>{fy}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {users.length > 0 && (
                    <div className="space-y-2">
                      <Label>Assign To</Label>
                      <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
                        <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Select user" /></SelectTrigger>
                        <SelectContent>
                          {users.map((u) => <SelectItem key={u._id} value={u._id}>{u.username} ({u.role})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-0" placeholder="Optional description" />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-secondary border-0 min-h-[60px]" placeholder="Internal notes (optional)" />
                </div>
                <Button type="submit" className="w-full">Create Task</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Pending', value: stats.pending || 0, color: 'text-yellow-500' },
          { label: 'In Progress', value: stats.in_progress || 0, color: 'text-blue-500' },
          { label: 'Review', value: stats.review || 0, color: 'text-purple-500' },
          { label: 'Completed', value: stats.completed || 0, color: 'text-green-500' },
          { label: 'Overdue', value: stats.overdue || 0, color: 'text-red-500' },
          { label: 'Due Soon', value: stats.dueSoon || 0, color: 'text-orange-500' },
        ].map((s) => (
          <Card key={s.label} className="border-0 bg-card">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for staff */}
      {isStaff && (
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
          {[
            { key: 'my', label: 'My Tasks' },
            { key: 'all', label: 'All Tasks' },
            { key: 'unassigned', label: 'Unassigned' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedTasks(new Set()); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-52 bg-secondary border-0 h-8 text-xs pl-8"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-secondary border-0 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{statusConfig[s]?.label || s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-36 bg-secondary border-0 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-44 bg-secondary border-0 h-8 text-xs"><SelectValue placeholder="All Clients" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="w-36 bg-secondary border-0 h-8 text-xs"
          placeholder="From"
          title="Due date from"
        />
        <Input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="w-36 bg-secondary border-0 h-8 text-xs"
          placeholder="To"
          title="Due date to"
        />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={clearFilters}>
            <X size={13} className="mr-1" />Clear
          </Button>
        )}
      </div>

      {/* Bulk actions */}
      {selectedTasks.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{selectedTasks.size} selected:</span>
          <Select onValueChange={handleBulkStatusUpdate} disabled={bulkUpdating}>
            <SelectTrigger className="w-40 bg-secondary border-0 h-8 text-xs">
              <SelectValue placeholder="Bulk set status..." />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.filter(s => s !== 'overdue').map((s) => (
                <SelectItem key={s} value={s}>{statusConfig[s]?.label || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canDelete && (
            <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => setShowBulkDeleteConfirm(true)} disabled={bulkDeleting}>
              <Trash2 size={13} className="mr-1" />
              Delete {selectedTasks.size}
            </Button>
          )}
        </div>
      )}

      {/* Task List */}
      <Card className="border-0 bg-card">
        <CardContent className="pt-4">
          {/* Select All */}
          {canDelete && displayedTasks.length > 0 && (
            <div className="flex items-center gap-2 pb-3 border-b border-border mb-2">
              <button onClick={toggleSelectAll} className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedTasks.size === displayedTasks.length && displayedTasks.length > 0 ? 'bg-primary border-primary' : 'border-muted-foreground/40 hover:border-muted-foreground'}`}>
                {selectedTasks.size === displayedTasks.length && displayedTasks.length > 0 && <CheckSquare size={12} className="text-primary-foreground" />}
              </button>
              <span className="text-xs text-muted-foreground">Select all ({displayedTasks.length})</span>
            </div>
          )}
          {displayedTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'No tasks matching filters. Try adjusting your criteria.' : 'No tasks found'}
              </p>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={clearFilters}>Clear filters</Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {displayedTasks.map((task) => {
                const sc = statusConfig[task.status] || statusConfig.pending;
                const pc = priorityConfig[task.priority] || priorityConfig.medium;
                const StatusIcon = sc.icon;
                const dueInfo = task.dueDate ? getRelativeDueDate(task.dueDate) : null;

                const isExpanded = expandedTask === task._id;
                return (
                  <div key={task._id} className="rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                    <div className="flex items-center gap-3 py-3 px-4">
                      {canDelete && (
                        <button onClick={() => toggleSelect(task._id)} className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${selectedTasks.has(task._id) ? 'bg-primary border-primary' : 'border-muted-foreground/40 hover:border-muted-foreground'}`}>
                          {selectedTasks.has(task._id) && <CheckSquare size={12} className="text-primary-foreground" />}
                        </button>
                      )}
                      <button onClick={() => setExpandedTask(isExpanded ? null : task._id)} className="shrink-0">
                        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <StatusIcon size={18} className={sc.color.split(' ')[1]} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{task.title}</span>
                          <Badge className={`text-[10px] px-1.5 py-0 ${pc.color} border-0`}>{pc.label}</Badge>
                          <Badge className={`text-[10px] px-1.5 py-0 ${sc.color} border-0`}>{sc.label}</Badge>
                          {task.fiscalYear && (
                            <span className="text-[10px] text-muted-foreground">FY {task.fiscalYear}</span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{task.client?.name}</span>
                          <span>{task.taskType}</span>
                          {task.assignedTo && <span>Assigned: {task.assignedTo.username}</span>}
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          {dueInfo && task.status !== 'completed' && (
                            <span className={`font-medium ${dueInfo.className}`}>{dueInfo.text}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {users.length > 0 && (
                          <Select value={task.assignedTo?._id || 'unassigned'} onValueChange={(v) => handleAssign(task._id, v === 'unassigned' ? null : v)}>
                            <SelectTrigger className="h-7 w-28 text-xs bg-secondary border-0">
                              <SelectValue placeholder="Assign" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {users.map((u) => <SelectItem key={u._id} value={u._id}>{u.username}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                        <Select value={task.status} onValueChange={(v) => handleStatusChange(task._id, v)}>
                          <SelectTrigger className="h-7 w-28 text-xs bg-secondary border-0"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => <SelectItem key={s} value={s}>{statusConfig[s]?.label || s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {canCreate && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100" onClick={() => handleDuplicate(task)} title="Duplicate task">
                            <Copy size={14} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100" onClick={() => handleViewHistory(task._id)} title="View history">
                          <History size={14} />
                        </Button>
                        {canDelete && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => setDeleteTaskId(task._id)}>
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-3 space-y-2">
                        {task.description && (
                          <p className="text-xs text-muted-foreground">{task.description}</p>
                        )}
                        {task.notes && (
                          <div className="text-xs">
                            <span className="text-muted-foreground font-medium">Notes: </span>
                            <span className="text-muted-foreground">{task.notes}</span>
                          </div>
                        )}
                        {task.taskType !== 'Other' && (
                          <DocumentChecklist taskType={task.taskType} clientId={task.client?._id} taskId={task._id} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Task History</DialogTitle></DialogHeader>
          {historyLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading history...</p>
          ) : historyData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No history found for this task.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {historyData.map((activity) => (
                <div key={activity._id} className="flex gap-3 text-xs">
                  <div className="w-1 rounded-full bg-primary/30 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-white">{activity.details}</p>
                    <p className="text-muted-foreground">
                      by {activity.performedBy?.username || 'Unknown'} &middot; {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={(v) => !v && setDeleteTaskId(null)}
        title="Delete task"
        description="This action cannot be undone. Are you sure?"
        confirmLabel="Delete"
        onConfirm={() => handleDelete(deleteTaskId)}
      />

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        title="Delete selected tasks"
        description={`Delete ${selectedTasks.size} selected task(s)? This cannot be undone.`}
        confirmLabel="Delete All"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
