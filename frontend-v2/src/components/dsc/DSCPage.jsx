import { useState, useEffect } from 'react';
import { dscService } from '@/services/dscService';
import { clientService } from '@/services/clientService';
import { usePermission } from '@/hooks/usePermission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { KeyRound, Plus, Trash2, AlertTriangle, CheckCircle2, Clock, Shield } from 'lucide-react';

const PROVIDERS = ['eMudhra', 'Sify', 'nCode', 'Capricorn', 'NSDL', 'Other'];
const PURPOSES = ['Income Tax', 'GST', 'ROC', 'MCA', 'General'];

export default function DSCPage() {
  const [dscs, setDscs] = useState([]);
  const [stats, setStats] = useState({});
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    client: '', holderName: '', classType: 'Class 2', provider: '', serialNumber: '',
    issuedDate: '', expiryDate: '', password: '', purpose: 'General', notes: '',
  });
  const canEdit = usePermission('client:edit');
  const canDelete = usePermission('client:delete');

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    try {
      const filters = {};
      if (filter === 'expiring') filters.expiringSoon = true;
      else if (filter !== 'all') filters.status = filter;

      const [dscData, statsData, clientData] = await Promise.all([
        dscService.getDSCs(filters),
        dscService.getDSCStats(),
        clientService.getClients(),
      ]);
      setDscs(dscData);
      setStats(statsData);
      setClients(clientData);
    } catch (error) {
      console.error('Error fetching DSCs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dscService.createDSC(form);
      setShowForm(false);
      setForm({ client: '', holderName: '', classType: 'Class 2', provider: '', serialNumber: '', issuedDate: '', expiryDate: '', password: '', purpose: 'General', notes: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating DSC:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this DSC record?')) return;
    try {
      await dscService.deleteDSC(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting DSC:', error);
    }
  };

  const getDaysUntilExpiry = (date) => {
    const days = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getExpiryBadge = (date, status) => {
    if (status === 'expired' || new Date(date) < new Date()) {
      return <Badge className="text-[10px] bg-red-500/10 text-red-500 border-0">Expired</Badge>;
    }
    const days = getDaysUntilExpiry(date);
    if (days <= 7) return <Badge className="text-[10px] bg-red-500/10 text-red-500 border-0">{days}d left</Badge>;
    if (days <= 30) return <Badge className="text-[10px] bg-yellow-500/10 text-yellow-500 border-0">{days}d left</Badge>;
    if (days <= 90) return <Badge className="text-[10px] bg-blue-500/10 text-blue-400 border-0">{days}d left</Badge>;
    return <Badge className="text-[10px] bg-green-500/10 text-green-500 border-0">Valid</Badge>;
  };

  if (loading) return <div className="text-muted-foreground">Loading DSC records...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <KeyRound size={24} /> DSC Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{stats.total || 0} certificates tracked</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus size={14} className="mr-1" /> Add DSC
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total || 0, icon: Shield, color: 'text-blue-400' },
          { label: 'Active', value: stats.active || 0, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Expiring Soon', value: stats.expiringSoon || 0, icon: Clock, color: 'text-yellow-500' },
          { label: 'Expired', value: stats.expired || 0, icon: AlertTriangle, color: 'text-red-500' },
        ].map(s => (
          <Card key={s.label} className="border-0 bg-card">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={14} className={s.color} />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="border-0 bg-card">
          <CardHeader><CardTitle className="text-base">Add DSC</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={form.client} onValueChange={(v) => setForm({ ...form, client: v })}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Holder Name</Label>
                  <Input value={form.holderName} onChange={(e) => setForm({ ...form, holderName: e.target.value })} className="bg-secondary border-0" required />
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={form.classType} onValueChange={(v) => setForm({ ...form, classType: v })}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Class 2">Class 2</SelectItem>
                      <SelectItem value="Class 3">Class 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="bg-secondary border-0" required />
                </div>
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Select value={form.purpose} onValueChange={(v) => setForm({ ...form, purpose: v })}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-secondary border-0" placeholder="DSC password" />
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="bg-secondary border-0" />
                </div>
                <div className="space-y-2">
                  <Label>Issued Date</Label>
                  <Input type="date" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} className="bg-secondary border-0" />
                </div>
              </div>
              <Button type="submit" disabled={!form.client || !form.holderName || !form.expiryDate}>Add DSC</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter & List */}
      <div className="flex gap-2 mb-2">
        {['all', 'active', 'expiring', 'expired'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'expiring' ? 'Expiring Soon' : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {dscs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No DSC records found</div>
      ) : (
        <div className="space-y-2">
          {dscs.map(dsc => (
            <Card key={dsc._id} className="border-0 bg-card">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{dsc.holderName}</span>
                      <Badge variant="outline" className="text-[10px]">{dsc.classType}</Badge>
                      {getExpiryBadge(dsc.expiryDate, dsc.status)}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>{dsc.client?.name || 'Unknown client'}</span>
                      {dsc.provider && <span>{dsc.provider}</span>}
                      {dsc.purpose && <span>{dsc.purpose}</span>}
                      <span>Expires: {new Date(dsc.expiryDate).toLocaleDateString('en-IN')}</span>
                      {dsc.password && <span className="text-primary">Password saved</span>}
                    </div>
                  </div>
                  {canDelete && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(dsc._id)}>
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
