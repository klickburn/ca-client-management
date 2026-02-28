import { useState, useEffect } from 'react';
import { docRequestService } from '@/services/docRequestService';
import { usePermission } from '@/hooks/usePermission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus, CheckCircle2, Circle, Loader2, Trash2, FileText,
} from 'lucide-react';

const CATEGORIES = ['Statement', 'Ledgers', 'Financials', 'Returns', 'Vendor Registration', 'Property Details', 'Other'];

export default function DocRequestManager({ clientId }) {
  const canEdit = usePermission('client:edit');
  const canDelete = usePermission('client:delete');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', fiscalYear: '', documents: [] });
  const [newDoc, setNewDoc] = useState({ name: '', category: 'Other', required: true });

  useEffect(() => { fetchRequests(); }, [clientId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await docRequestService.getRequests(clientId);
      setRequests(data);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const addDocToForm = () => {
    if (!newDoc.name.trim()) return;
    setForm({ ...form, documents: [...form.documents, { ...newDoc }] });
    setNewDoc({ name: '', category: 'Other', required: true });
  };

  const removeDocFromForm = (idx) => {
    setForm({ ...form, documents: form.documents.filter((_, i) => i !== idx) });
  };

  const handleCreate = async () => {
    if (!form.title.trim() || form.documents.length === 0) return;
    try {
      await docRequestService.createRequest(clientId, {
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      });
      setDialogOpen(false);
      setForm({ title: '', description: '', dueDate: '', fiscalYear: '', documents: [] });
      await fetchRequests();
    } catch (err) {
      console.error('Error creating request:', err);
    }
  };

  const handleDelete = async (requestId) => {
    try {
      await docRequestService.deleteRequest(requestId);
      await fetchRequests();
    } catch (err) {
      console.error('Error deleting request:', err);
    }
  };

  const statusColor = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    partially_fulfilled: 'bg-blue-500/10 text-blue-400',
    fulfilled: 'bg-green-500/10 text-green-500',
  };
  const statusLabel = { pending: 'Pending', partially_fulfilled: 'Partial', fulfilled: 'Complete' };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setDialogOpen(true)} className="h-8 text-xs">
            <Plus size={14} className="mr-1" /> Request Documents
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>
      ) : requests.length === 0 ? (
        <Card className="border-0 bg-card">
          <CardContent className="py-12 text-center">
            <FileText size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No document requests created yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const fulfilled = req.documents.filter(d => d.fulfilled).length;
            const total = req.documents.length;
            return (
              <Card key={req._id} className="border-0 bg-card">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-medium text-white">{req.title}</h3>
                      {req.description && <p className="text-[11px] text-muted-foreground">{req.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] border-0 ${statusColor[req.status]}`}>
                        {statusLabel[req.status]} ({fulfilled}/{total})
                      </Badge>
                      {req.dueDate && (
                        <span className="text-[11px] text-muted-foreground">Due: {new Date(req.dueDate).toLocaleDateString()}</span>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(req._id)}>
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1 mb-2">
                    <div className={`h-1 rounded-full ${req.status === 'fulfilled' ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${total ? (fulfilled / total) * 100 : 0}%` }} />
                  </div>
                  <div className="space-y-1">
                    {req.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs py-1">
                        {doc.fulfilled ? <CheckCircle2 size={12} className="text-green-500" /> : <Circle size={12} className="text-muted-foreground" />}
                        <span className={doc.fulfilled ? 'text-muted-foreground line-through' : 'text-white'}>{doc.name}</span>
                        <span className="text-muted-foreground">({doc.category})</span>
                        {doc.required && !doc.fulfilled && <Badge className="text-[9px] px-1 py-0 bg-red-500/10 text-red-500 border-0">Req</Badge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-0 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Request Documents from Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Upload Form 16 for FY 2024-25" className="bg-secondary border-0 h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description (optional)</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Additional instructions..." className="bg-secondary border-0 h-8 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="bg-secondary border-0 h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fiscal Year</Label>
                <Input value={form.fiscalYear} onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })} placeholder="2024-2025" className="bg-secondary border-0 h-8 text-xs" />
              </div>
            </div>

            {/* Add documents */}
            <div className="space-y-2">
              <Label className="text-xs">Documents to Request</Label>
              <div className="flex gap-2">
                <Input value={newDoc.name} onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })} placeholder="Document name" className="bg-secondary border-0 h-8 text-xs flex-1" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDocToForm())} />
                <Select value={newDoc.category} onValueChange={(v) => setNewDoc({ ...newDoc, category: v })}>
                  <SelectTrigger className="w-28 h-8 text-xs bg-secondary border-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="secondary" onClick={addDocToForm} className="h-8 text-xs">Add</Button>
              </div>
              {form.documents.length > 0 && (
                <div className="space-y-1 mt-2">
                  {form.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1.5">
                      <span className="text-xs text-white">{doc.name} ({doc.category})</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeDocFromForm(idx)}>
                        <Trash2 size={10} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleCreate} disabled={!form.title.trim() || form.documents.length === 0} className="w-full h-8 text-xs">
              Send Request to Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
