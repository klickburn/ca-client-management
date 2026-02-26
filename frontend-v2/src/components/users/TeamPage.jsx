import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { ROLE_LABELS, CREATION_HIERARCHY } from '@/lib/permissions';
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
import { Plus, Trash2, UserCircle } from 'lucide-react';

export default function TeamPage() {
  const { user } = useAuth();
  const canDelete = usePermission('user:delete');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'seniorCA' });
  const [error, setError] = useState('');

  const creatableRoles = CREATION_HIERARCHY[user?.role] || [];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await userService.createUser(form);
      setOpen(false);
      setForm({ username: '', password: '', role: 'seniorCA' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try {
      await userService.deleteUser(userId);
      setUsers(users.filter((u) => u._id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Team</h1>
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
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="bg-secondary border-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {creatableRoles.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Create User</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <Card key={u._id} className="border-0 bg-card">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <UserCircle size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{u.username}</p>
                    <Badge variant="outline" className="text-[10px] mt-1 border-primary/50 text-primary">
                      {ROLE_LABELS[u.role] || u.role}
                    </Badge>
                  </div>
                </div>
                {canDelete && u._id !== user?.userId && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(u._id)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
              {u.supervisorId && (
                <p className="text-xs text-muted-foreground mt-3">
                  Supervisor: {u.supervisorId.username}
                </p>
              )}
              {u.clientId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Linked to: {u.clientId.name || u.clientId.email}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
