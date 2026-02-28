import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { filingService } from '@/services/filingService';
import { docRequestService } from '@/services/docRequestService';
import { invoiceService } from '@/services/invoiceService';
import { messageService } from '@/services/messageService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileCheck, Clock, AlertTriangle, CheckCircle2, Circle,
  FileText, IndianRupee, MessageSquare, Calendar, ArrowRight,
  Loader2,
} from 'lucide-react';

const FISCAL_YEARS = ['2025-2026', '2024-2025', '2023-2024'];

function getCurrentFiscalYear() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export default function ClientPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const clientId = user?.clientId;

  const [filings, setFilings] = useState([]);
  const [filingStats, setFilingStats] = useState({});
  const [docRequests, setDocRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const fiscalYear = getCurrentFiscalYear();

  useEffect(() => {
    if (!clientId) return;
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [filingsData, statsData, requestsData, invoicesData, msgCount] = await Promise.all([
        filingService.getFilings(clientId, fiscalYear).catch(() => []),
        filingService.getStats(clientId, fiscalYear).catch(() => ({})),
        docRequestService.getRequests(clientId).catch(() => []),
        invoiceService.getInvoices({ clientId }).catch(() => []),
        messageService.getUnreadCount(clientId).catch(() => ({ count: 0 })),
      ]);
      setFilings(filingsData);
      setFilingStats(statsData);
      setDocRequests(requestsData.filter(r => r.status !== 'fulfilled'));
      setInvoices(invoicesData.slice(0, 5));
      setUnreadMessages(msgCount.count || 0);
    } catch (err) {
      console.error('Error fetching portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!clientId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Your account is not linked to a client profile. Please contact your CA firm.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  // Compute filing summaries by type
  const filingsByType = {};
  filings.forEach(f => {
    if (!filingsByType[f.filingType]) filingsByType[f.filingType] = { total: 0, filed: 0, overdue: 0 };
    filingsByType[f.filingType].total++;
    if (['filed', 'verified'].includes(f.status)) filingsByType[f.filingType].filed++;
    if (['not_started', 'in_progress'].includes(f.status) && f.dueDate && new Date(f.dueDate) < new Date()) {
      filingsByType[f.filingType].overdue++;
    }
  });

  // Upcoming deadlines (next 30 days)
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingDeadlines = filings
    .filter(f => ['not_started', 'in_progress'].includes(f.status) && f.dueDate)
    .filter(f => new Date(f.dueDate) <= thirtyDays)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6);

  // Pending doc count
  const pendingDocCount = docRequests.reduce((sum, r) => sum + r.documents.filter(d => !d.fulfilled).length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome, {user?.username}</h1>
        <p className="text-sm text-muted-foreground mt-1">FY {fiscalYear} Overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStat
          icon={FileCheck} label="Filings Complete"
          value={`${filingStats.filed || 0}/${filingStats.total || 0}`}
          color={filingStats.overdue ? 'text-red-500' : 'text-green-500'}
        />
        <QuickStat
          icon={AlertTriangle} label="Overdue"
          value={filingStats.overdue || 0}
          color={filingStats.overdue ? 'text-red-500' : 'text-zinc-400'}
        />
        <QuickStat
          icon={FileText} label="Docs Pending"
          value={pendingDocCount}
          color={pendingDocCount > 0 ? 'text-yellow-500' : 'text-zinc-400'}
          onClick={() => navigate('/portal/documents')}
        />
        <QuickStat
          icon={MessageSquare} label="Unread Messages"
          value={unreadMessages}
          color={unreadMessages > 0 ? 'text-blue-400' : 'text-zinc-400'}
          onClick={() => navigate('/portal/messages')}
        />
      </div>

      {/* Filing Status by Type */}
      {Object.keys(filingsByType).length > 0 && (
        <Card className="border-0 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filing Status</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate('/portal/filings')}>
                View All <ArrowRight size={12} className="ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(filingsByType).map(([type, data]) => {
                const allDone = data.filed === data.total;
                const hasOverdue = data.overdue > 0;
                return (
                  <div key={type} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{type}</span>
                      {allDone ? (
                        <Badge className="bg-green-500/10 text-green-500 border-0 text-[10px]">Complete</Badge>
                      ) : hasOverdue ? (
                        <Badge className="bg-red-500/10 text-red-500 border-0 text-[10px]">Overdue</Badge>
                      ) : (
                        <Badge className="bg-yellow-500/10 text-yellow-500 border-0 text-[10px]">In Progress</Badge>
                      )}
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${allDone ? 'bg-green-500' : hasOverdue ? 'bg-red-500' : 'bg-yellow-500'}`}
                        style={{ width: `${data.total ? (data.filed / data.total) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{data.filed} of {data.total} filed</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Deadlines */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar size={16} />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming deadlines</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map(f => {
                  const due = new Date(f.dueDate);
                  const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysLeft < 0;
                  return (
                    <div key={f._id} className="flex items-center justify-between py-2 border-b border-muted/30 last:border-0">
                      <div>
                        <p className="text-sm text-white">{f.filingType} — {f.period}</p>
                        <p className="text-[11px] text-muted-foreground">{due.toLocaleDateString()}</p>
                      </div>
                      <Badge className={`text-[10px] border-0 ${isOverdue ? 'bg-red-500/10 text-red-500' : daysLeft <= 7 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-zinc-500/10 text-zinc-400'}`}>
                        {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Document Requests */}
        <Card className="border-0 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText size={16} />
                Document Requests
              </CardTitle>
              {docRequests.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate('/portal/documents')}>
                  View All <ArrowRight size={12} className="ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {docRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending requests</p>
            ) : (
              <div className="space-y-2">
                {docRequests.slice(0, 4).map(req => {
                  const fulfilled = req.documents.filter(d => d.fulfilled).length;
                  const total = req.documents.length;
                  return (
                    <div key={req._id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-white">{req.title}</p>
                        <span className="text-[11px] text-muted-foreground">{fulfilled}/{total}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1">
                        <div className="h-1 rounded-full bg-primary" style={{ width: `${total ? (fulfilled / total) * 100 : 0}%` }} />
                      </div>
                      {req.dueDate && (
                        <p className="text-[10px] text-muted-foreground mt-1">Due: {new Date(req.dueDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      {invoices.length > 0 && (
        <Card className="border-0 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee size={16} />
                Recent Invoices
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate('/portal/billing')}>
                View All <ArrowRight size={12} className="ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv._id} className="flex items-center justify-between py-2 border-b border-muted/30 last:border-0">
                  <div>
                    <p className="text-sm text-white">{inv.description || `Invoice #${inv.invoiceNumber || inv._id.slice(-6)}`}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">Rs {inv.totalAmount?.toLocaleString()}</p>
                    <Badge className={`text-[10px] border-0 ${inv.status === 'paid' ? 'bg-green-500/10 text-green-500' : inv.status === 'overdue' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-card rounded-lg p-4 text-left ${onClick ? 'hover:bg-card/80 cursor-pointer' : 'cursor-default'} transition-colors`}
    >
      <Icon size={18} className={`${color} mb-2`} />
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </button>
  );
}
