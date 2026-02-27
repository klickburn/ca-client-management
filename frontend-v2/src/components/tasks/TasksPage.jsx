import { useState, useEffect } from 'react';
import { taskService } from '@/services/taskService';
import { clientService } from '@/services/clientService';
import { userService } from '@/services/userService';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus, Calendar, Clock, AlertTriangle, CheckCircle2,
  Circle, ArrowUpCircle, Trash2,
} from 'lucide-react';

const TASK_TYPES = ['ITR Filing', 'GST Filing', 'TDS Return', 'Audit', 'ROC Filing', 'Tax Planning', 'Bookkeeping', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['pending', 'in_progress', 'review', 'completed'];
const FISCAL_YEARS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023'];

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
  const [stats, setStats] = useState({});
  const [form, setForm] = useState({
    title: '', description: '', client: '', taskType: 'Other',
    priority: 'medium', dueDate: '', assignedTo: '', fiscalYear: '', notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterPriority]);

  const fetchData = async () => {
    try {
      const [tasksData, statsData, clientsData] = await Promise.all([
        taskService.getTasks({ status: filterStatus !== 'all' ? filterStatus : undefined, priority: filterPriority !== 'all' ? filterPriority : undefined }),
        taskService.getTaskStats(),
        clientService.getClients(),
      ]);
      setTasks(tasksData);
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
      setForm({ title: '', description: '', client: '', taskType: 'Other', priority: 'medium', dueDate: '', assignedTo: '', fiscalYear: '', notes: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskService.deleteTask(taskId);
      fetchData();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const isOverdue = (task) => task.status !== 'completed' && new Date(task.dueDate) < new Date();

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
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-0" placeholder="Optional description" />
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

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-secondary border-0 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-36 bg-secondary border-0 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <Card className="border-0 bg-card">
        <CardContent className="pt-4">
          {tasks.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No tasks found</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const overdue = isOverdue(task);
                const sc = statusConfig[overdue ? 'overdue' : task.status] || statusConfig.pending;
                const pc = priorityConfig[task.priority] || priorityConfig.medium;
                const StatusIcon = sc.icon;

                return (
                  <div key={task._id} className="flex items-center gap-3 py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                    <StatusIcon size={18} className={sc.color.split(' ')[1]} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{task.title}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 ${pc.color} border-0`}>{pc.label}</Badge>
                        <Badge className={`text-[10px] px-1.5 py-0 ${sc.color} border-0`}>{sc.label}</Badge>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{task.client?.name}</span>
                        <span>{task.taskType}</span>
                        {task.assignedTo && <span>Assigned: {task.assignedTo.username}</span>}
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select value={task.status} onValueChange={(v) => handleStatusChange(task._id, v)}>
                        <SelectTrigger className="h-7 w-28 text-xs bg-secondary border-0"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {canDelete && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDelete(task._id)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
