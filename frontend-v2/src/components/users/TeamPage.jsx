import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { userService } from '@/services/userService';
import { clientService } from '@/services/clientService';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { ROLE_LABELS, CREATION_HIERARCHY } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { GridSkeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, UserCircle, Search, X, ListTodo, CheckCircle2, AlertTriangle } from 'lucide-react';

const ALL_ROLES = ['partner', 'seniorCA', 'article', 'client'];

const roleColors = {
  partner: 'border-primary/50 text-primary',
  seniorCA: 'border-blue-400/50 text-blue-400',
  article: 'border-orange-400/50 text-orange-400',
  client: 'border-green-400/50 text-green-400',
};

export default function TeamPage() {
  const { user } = useAuth();
  const canCreate = usePermission('user:create');
  const canDelete = usePermission('user:delete');
  const canManage = usePermission('team:manage');
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [form, setForm] = useState({ username: '', password: '', role: 'seniorCA', supervisorId: '', clientId: '' });
  const [error, setError] = useState('');
  const [deleteUserId, setDeleteUserId] = useState(null);

  const creatableRoles = CREATION_HIERARCHY[user?.role] || [];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersData, clientsData] = await Promise.all([
        userService.getUsers(),
        clientService.getClients().catch(() => []),
      ]);
      setUsers(usersData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { username: form.username, password: form.password, role: form.role };
      if (form.role === 'article' && form.supervisorId) payload.supervisorId = form.supervisorId;
      if (form.role === 'client' && form.clientId) payload.clientId = form.clientId;
      await userService.createUser(payload);
      setOpen(false);
      setForm({ username: '', password: '', role: 'seniorCA', supervisorId: '', clientId: '' });
      toast.success('User created successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await userService.deleteUser(userId);
      setUsers(users.filter((u) => u._id !== userId));
      toast.success('User deleted');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.assignRole(userId, newRole);
      toast.success('Role updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to change role');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterRole('all');
  };

  const hasFilters = searchQuery || filterRole !== 'all';

  const displayedUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterRole !== 'all' && u.role !== filterRole) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!u.username.toLowerCase().includes(q) && !(ROLE_LABELS[u.role] || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [users, filterRole, searchQuery]);

  // Group by role for counts
  const roleCounts = useMemo(() => {
    const counts = {};
    users.forEach(u => { counts[u.role] = (counts[u.role] || 0) + 1; });
    return counts;
  }, [users]);

  // Supervisors list for article creation
  const supervisors = useMemo(() => {
    return users.filter(u => u.role === 'partner' || u.role === 'seniorCA');
  }, [users]);

  // Clients not yet linked to any user
  const unlinkedClients = useMemo(() => {
    const linkedIds = new Set(users.filter(u => u.clientId).map(u => u.clientId._id || u.clientId));
    return clients.filter(c => !linkedIds.has(c._id));
  }, [users, clients]);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-7 w-20 bg-muted animate-pulse rounded" />
      <GridSkeleton count={6} cols={3} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {users.length} member{users.length !== 1 ? 's' : ''}
            {Object.entries(roleCounts).length > 0 && (
              <span> — {Object.entries(roleCounts).map(([role, count]) => `${count} ${ROLE_LABELS[role] || role}`).join(', ')}</span>
            )}
          </p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-2" /> Add User</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="bg-secondary border-0" required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-secondary border-0" required />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v, supervisorId: '', clientId: '' })}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {creatableRoles.map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.role === 'article' && (
                  <div className="space-y-2">
                    <Label>Supervisor</Label>
                    <Select value={form.supervisorId} onValueChange={(v) => setForm({ ...form, supervisorId: v })}>
                      <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Select supervisor" /></SelectTrigger>
                      <SelectContent>
                        {supervisors.map((s) => (
                          <SelectItem key={s._id} value={s._id}>{s.username} ({ROLE_LABELS[s.role]})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {form.role === 'client' && (
                  <div className="space-y-2">
                    <Label>Link to Client</Label>
                    <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                      <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Select client" /></SelectTrigger>
                      <SelectContent>
                        {unlinkedClients.map((c) => (
                          <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                        ))}
                        {unlinkedClients.length === 0 && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">All clients already linked</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full">Create User</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-52 bg-secondary border-0 h-8 text-xs pl-8"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-36 bg-secondary border-0 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]} ({roleCounts[r] || 0})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={clearFilters}>
            <X size={13} className="mr-1" />Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{displayedUsers.length} shown</span>
      </div>

      {/* User Grid */}
      {displayedUsers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {hasFilters ? 'No users matching filters.' : 'No team members found.'}
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={clearFilters}>Clear filters</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedUsers.map((u) => {
            const stats = u.taskStats || { total: 0, open: 0, completed: 0, overdue: 0 };
            const isCurrentUser = u._id === user?.userId;

            return (
              <Card key={u._id} className="border-0 bg-card group">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                        <UserCircle size={20} className="text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{u.username}</p>
                          {isCurrentUser && <span className="text-[10px] text-muted-foreground">(You)</span>}
                        </div>
                        {canManage && !isCurrentUser ? (
                          <Select value={u.role} onValueChange={(v) => handleRoleChange(u._id, v)}>
                            <SelectTrigger className="h-5 w-auto px-1.5 py-0 text-[10px] mt-1 bg-transparent border-primary/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {creatableRoles.map((r) => (
                                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={`text-[10px] mt-1 ${roleColors[u.role] || 'border-primary/50 text-primary'}`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {canDelete && !isCurrentUser && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => setDeleteUserId(u._id)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>

                  {/* Task Stats */}
                  {(u.role !== 'client') && (
                    <div className="flex gap-3 mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-1 text-xs">
                        <ListTodo size={11} className="text-blue-400" />
                        <span className="text-muted-foreground">{stats.open} open</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <CheckCircle2 size={11} className="text-green-400" />
                        <span className="text-muted-foreground">{stats.completed} done</span>
                      </div>
                      {stats.overdue > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <AlertTriangle size={11} className="text-red-400" />
                          <span className="text-red-400">{stats.overdue} overdue</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="mt-2 space-y-0.5">
                    {u.supervisorId && (
                      <p className="text-[10px] text-muted-foreground">
                        Supervisor: {u.supervisorId.username}
                      </p>
                    )}
                    {u.clientId && (
                      <p className="text-[10px] text-muted-foreground">
                        Linked: {u.clientId.name || u.clientId.email}
                      </p>
                    )}
                    {u.createdAt && (
                      <p className="text-[10px] text-muted-foreground">
                        Joined {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteUserId}
        onOpenChange={(v) => !v && setDeleteUserId(null)}
        title="Delete user"
        description="This user's tasks will be unassigned. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => handleDelete(deleteUserId)}
      />
    </div>
  );
}
