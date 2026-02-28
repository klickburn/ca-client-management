import { useState, useEffect } from 'react';
import { filingService } from '@/services/filingService';
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
  FileCheck, Loader2, Sparkles, CheckCircle2, Clock, Circle,
  AlertTriangle, XCircle, Calendar,
} from 'lucide-react';

const FISCAL_YEARS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023'];

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'bg-zinc-500/10 text-zinc-400', icon: Circle },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-400', icon: Clock },
  filed:       { label: 'Filed',       color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
  verified:    { label: 'Verified',    color: 'bg-emerald-500/10 text-emerald-400', icon: FileCheck },
  rejected:    { label: 'Rejected',    color: 'bg-red-500/10 text-red-500', icon: XCircle },
};

// Group filing types by category for display
const FILING_CATEGORIES = [
  {
    label: 'Income Tax',
    types: ['ITR', 'Advance Tax', 'TDS'],
  },
  {
    label: 'GST',
    types: ['GSTR-1', 'GSTR-3B', 'GSTR-9'],
  },
  {
    label: 'Audit & ROC',
    types: ['Tax Audit', 'ROC-MGT7', 'ROC-AOC4'],
  },
];

const RETURN_TYPES = {
  'ITR': ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4', 'ITR-5', 'ITR-6', 'ITR-7'],
};

export default function FilingTracker({ clientId }) {
  const canEdit = usePermission('client:edit');
  const [filings, setFilings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(FISCAL_YEARS[0]);
  const [selectedFiling, setSelectedFiling] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => { fetchData(); }, [clientId, fiscalYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [filingsData, statsData] = await Promise.all([
        filingService.getFilings(clientId, fiscalYear),
        filingService.getStats(clientId, fiscalYear),
      ]);
      setFilings(filingsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching filings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await filingService.generateFilings(clientId, fiscalYear);
      await fetchData();
    } catch (err) {
      console.error('Error generating filings:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateFiling = async (updates) => {
    if (!selectedFiling) return;
    try {
      await filingService.updateFiling(selectedFiling._id, updates);
      setDialogOpen(false);
      setSelectedFiling(null);
      await fetchData();
    } catch (err) {
      console.error('Error updating filing:', err);
    }
  };

  const openFiling = (filing) => {
    setSelectedFiling({ ...filing });
    setDialogOpen(true);
  };

  const isOverdue = (filing) => {
    if (!filing.dueDate) return false;
    return ['not_started', 'in_progress'].includes(filing.status) && new Date(filing.dueDate) < new Date();
  };

  // Group filings by type
  const filingsByType = {};
  filings.forEach(f => {
    if (!filingsByType[f.filingType]) filingsByType[f.filingType] = [];
    filingsByType[f.filingType].push(f);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={fiscalYear} onValueChange={setFiscalYear}>
            <SelectTrigger className="w-36 h-8 text-xs bg-secondary border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FISCAL_YEARS.map(fy => <SelectItem key={fy} value={fy}>FY {fy}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleGenerate} disabled={generating} className="h-8 text-xs">
            {generating ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Sparkles size={14} className="mr-1" />}
            Generate Filings
          </Button>
        )}
      </div>

      {/* Stats Bar */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Filed', value: stats.filed || 0, color: 'text-green-500' },
            { label: 'Verified', value: stats.verified || 0, color: 'text-emerald-400' },
            { label: 'In Progress', value: stats.in_progress || 0, color: 'text-blue-400' },
            { label: 'Not Started', value: stats.not_started || 0, color: 'text-zinc-400' },
            { label: 'Overdue', value: stats.overdue || 0, color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="bg-muted/50 rounded-lg px-3 py-2 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filing Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : filings.length === 0 ? (
        <Card className="border-0 bg-card">
          <CardContent className="py-12 text-center">
            <FileCheck size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No filings generated for FY {fiscalYear}</p>
            {canEdit && (
              <p className="text-xs text-muted-foreground mt-1">
                Click "Generate Filings" to auto-create filing obligations based on client services
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        FILING_CATEGORIES.map(category => {
          const categoryFilings = category.types.filter(t => filingsByType[t]);
          if (categoryFilings.length === 0) return null;

          return (
            <Card key={category.label} className="border-0 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{category.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryFilings.map(type => {
                  const typeFilings = filingsByType[type] || [];
                  const sortedFilings = sortFilings(typeFilings);

                  return (
                    <div key={type}>
                      <p className="text-xs font-medium text-white mb-2">{type}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {sortedFilings.map(filing => {
                          const overdue = isOverdue(filing);
                          const sc = STATUS_CONFIG[filing.status];
                          const StatusIcon = overdue ? AlertTriangle : sc.icon;
                          const colorClass = overdue ? 'bg-red-500/10 text-red-500 ring-1 ring-red-500/30' : sc.color;

                          return (
                            <button
                              key={filing._id}
                              onClick={() => openFiling(filing)}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-all hover:scale-105 ${colorClass}`}
                              title={`${filing.period} — ${sc.label}${overdue ? ' (Overdue)' : ''}`}
                            >
                              <StatusIcon size={11} />
                              <span>{filing.period}</span>
                              {filing.acknowledgmentNumber && <CheckCircle2 size={10} className="text-green-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Filing Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-0 max-w-md">
          {selectedFiling && (
            <FilingDetailDialog
              filing={selectedFiling}
              canEdit={canEdit}
              onUpdate={handleUpdateFiling}
              onClose={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function sortFilings(filings) {
  const periodOrder = {
    'Annual': 0,
    'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4,
    'April': 1, 'May': 2, 'June': 3, 'July': 4, 'August': 5, 'September': 6,
    'October': 7, 'November': 8, 'December': 9, 'January': 10, 'February': 11, 'March': 12,
  };
  return [...filings].sort((a, b) => (periodOrder[a.period] || 99) - (periodOrder[b.period] || 99));
}

function FilingDetailDialog({ filing, canEdit, onUpdate, onClose }) {
  const [form, setForm] = useState({
    status: filing.status,
    acknowledgmentNumber: filing.acknowledgmentNumber || '',
    returnType: filing.returnType || '',
    filedDate: filing.filedDate ? filing.filedDate.split('T')[0] : '',
    notes: filing.notes || '',
  });

  const sc = STATUS_CONFIG[form.status];
  const StatusIcon = sc.icon;
  const isOverdue = filing.dueDate && ['not_started', 'in_progress'].includes(filing.status) && new Date(filing.dueDate) < new Date();

  const handleSave = () => {
    const updates = { ...form };
    if (updates.filedDate) updates.filedDate = new Date(updates.filedDate);
    else delete updates.filedDate;
    onUpdate(updates);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base flex items-center gap-2">
          <StatusIcon size={16} className={sc.color.split(' ')[1]} />
          {filing.filingType} — {filing.period}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 mt-2">
        {/* Info Row */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>FY {filing.fiscalYear}</span>
          {filing.dueDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
              <Calendar size={11} />
              Due: {new Date(filing.dueDate).toLocaleDateString()}
              {isOverdue && ' (Overdue)'}
            </span>
          )}
        </div>

        {/* Status */}
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })} disabled={!canEdit}>
            <SelectTrigger className="bg-secondary border-0 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Return Type (for ITR) */}
        {RETURN_TYPES[filing.filingType] && (
          <div className="space-y-1">
            <Label className="text-xs">Return Type</Label>
            <Select value={form.returnType} onValueChange={(v) => setForm({ ...form, returnType: v })} disabled={!canEdit}>
              <SelectTrigger className="bg-secondary border-0 h-8 text-xs"><SelectValue placeholder="Select return type" /></SelectTrigger>
              <SelectContent>
                {RETURN_TYPES[filing.filingType].map(rt => (
                  <SelectItem key={rt} value={rt}>{rt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Ack Number */}
        <div className="space-y-1">
          <Label className="text-xs">Acknowledgment Number</Label>
          <Input
            value={form.acknowledgmentNumber}
            onChange={(e) => setForm({ ...form, acknowledgmentNumber: e.target.value })}
            placeholder="e.g. 1234567890"
            className="bg-secondary border-0 h-8 text-xs"
            disabled={!canEdit}
          />
        </div>

        {/* Filed Date */}
        <div className="space-y-1">
          <Label className="text-xs">Filed Date</Label>
          <Input
            type="date"
            value={form.filedDate}
            onChange={(e) => setForm({ ...form, filedDate: e.target.value })}
            className="bg-secondary border-0 h-8 text-xs"
            disabled={!canEdit}
          />
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <Label className="text-xs">Notes</Label>
          <Input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any additional notes..."
            className="bg-secondary border-0 h-8 text-xs"
            disabled={!canEdit}
          />
        </div>

        {/* Filed By */}
        {filing.filedBy && (
          <p className="text-[11px] text-muted-foreground">
            Filed by: {filing.filedBy.username}
          </p>
        )}

        {/* Actions */}
        {canEdit && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleSave} className="h-8 text-xs flex-1">
              Save Changes
            </Button>
            <Button size="sm" variant="outline" onClick={onClose} className="h-8 text-xs">
              Cancel
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
