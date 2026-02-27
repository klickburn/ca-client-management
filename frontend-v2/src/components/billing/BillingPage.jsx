import { useState, useEffect } from 'react';
import { invoiceService } from '@/services/invoiceService';
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, IndianRupee, Trash2, CreditCard } from 'lucide-react';

const statusConfig = {
  draft:     { label: 'Draft',     color: 'bg-muted text-muted-foreground' },
  sent:      { label: 'Sent',      color: 'bg-blue-500/10 text-blue-400' },
  paid:      { label: 'Paid',      color: 'bg-green-500/10 text-green-500' },
  overdue:   { label: 'Overdue',   color: 'bg-red-500/10 text-red-400' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
};

export default function BillingPage() {
  const canCreate = usePermission('billing:create');
  const canEdit = usePermission('billing:edit');
  const canDelete = usePermission('billing:delete');
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({
    client: '', dueDate: '', notes: '',
    items: [{ description: '', amount: '' }],
  });

  useEffect(() => { fetchData(); }, [filterStatus]);

  const fetchData = async () => {
    try {
      const [invoicesData, statsData, clientsData] = await Promise.all([
        invoiceService.getInvoices({ status: filterStatus !== 'all' ? filterStatus : undefined }),
        invoiceService.getInvoiceStats(),
        clientService.getClients(),
      ]);
      setInvoices(invoicesData);
      setStats(statsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const items = form.items.filter(i => i.description && i.amount).map(i => ({ ...i, amount: Number(i.amount) }));
      await invoiceService.createInvoice({ ...form, items });
      setDialogOpen(false);
      setForm({ client: '', dueDate: '', notes: '', items: [{ description: '', amount: '' }] });
      fetchData();
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', amount: '' }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const handlePayment = async () => {
    if (!paymentAmount || !paymentDialog) return;
    try {
      await invoiceService.recordPayment(paymentDialog, Number(paymentAmount));
      setPaymentDialog(null);
      setPaymentAmount('');
      fetchData();
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await invoiceService.updateInvoice(id, { status });
      fetchData();
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await invoiceService.deleteInvoice(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  const totalFormAmount = form.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  if (loading) return <div className="text-muted-foreground">Loading invoices...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-2" />New Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
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
                    <Label>Due Date</Label>
                    <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required className="bg-secondary border-0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Line Items</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={addItem} className="h-7 text-xs">
                      <Plus size={12} className="mr-1" />Add Item
                    </Button>
                  </div>
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} className="bg-secondary border-0 flex-1" />
                      <Input type="number" placeholder="Amount" value={item.amount} onChange={(e) => updateItem(idx, 'amount', e.target.value)} className="bg-secondary border-0 w-28" />
                      {form.items.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeItem(idx)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                  {totalFormAmount > 0 && (
                    <p className="text-sm text-right text-muted-foreground">Total: {formatCurrency(totalFormAmount)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-secondary border-0" placeholder="Optional notes" />
                </div>
                <Button type="submit" className="w-full">Create Invoice</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold text-green-500">{formatCurrency(stats.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-xl font-bold text-yellow-500">{formatCurrency(stats.pendingRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Paid Invoices</p>
            <p className="text-xl font-bold text-green-500">{stats.paid || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-xl font-bold text-red-500">{stats.overdue || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-secondary border-0 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Invoice List */}
      <Card className="border-0 bg-card">
        <CardContent className="pt-4">
          {invoices.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No invoices found</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => {
                const sc = statusConfig[inv.status] || statusConfig.draft;
                return (
                  <div key={inv._id} className="flex items-center gap-3 py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                    <IndianRupee size={18} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{inv.invoiceNumber}</span>
                        <span className="text-sm text-muted-foreground">- {inv.client?.name}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 ${sc.color} border-0`}>{sc.label}</Badge>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{formatCurrency(inv.totalAmount)}</span>
                        {inv.paidAmount > 0 && <span>Paid: {formatCurrency(inv.paidAmount)}</span>}
                        <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                        {inv.items?.length > 0 && <span>{inv.items.length} item(s)</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {canEdit && inv.status !== 'paid' && inv.status !== 'cancelled' && (
                        <>
                          <Select value={inv.status} onValueChange={(v) => handleStatusChange(inv._id, v)}>
                            <SelectTrigger className="h-7 w-24 text-xs bg-secondary border-0"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => { setPaymentDialog(inv._id); setPaymentAmount(''); }}>
                            <CreditCard size={14} />
                          </Button>
                        </>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDelete(inv._id)}>
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

      {/* Payment Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={(open) => !open && setPaymentDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Amount (INR)</Label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="bg-secondary border-0" placeholder="Enter amount" />
            </div>
            <Button onClick={handlePayment} className="w-full" disabled={!paymentAmount}>Record Payment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
