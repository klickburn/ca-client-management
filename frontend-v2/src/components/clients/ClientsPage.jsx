import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService } from '@/services/clientService';
import { usePermission } from '@/hooks/usePermission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Trash2, Phone, Mail } from 'lucide-react';

const CLIENT_TYPES = ['Individual', 'Partnership', 'LLP', 'Pvt Ltd', 'Public Ltd', 'HUF', 'Other'];
const SERVICES = ['Income Tax Filing', 'GST Filing', 'Accounting', 'Audit', 'Company Formation', 'Consultancy', 'Other'];

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const canCreate = usePermission('client:create');
  const canDelete = usePermission('client:delete');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, clientId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await clientService.deleteClient(clientId);
      setClients(clients.filter((c) => c._id !== clientId));
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const filtered = clients
    .filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.panNumber?.toLowerCase().includes(q) ||
        c.gstNumber?.toLowerCase().includes(q) ||
        c.aadharNumber?.includes(q) ||
        c.address?.toLowerCase().includes(q)
      );
      const matchesType = filterType === 'all' || c.clientType === filterType;
      const matchesService = filterService === 'all' || c.services?.includes(filterService);
      return matchesSearch && matchesType && matchesService;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'type') return (a.clientType || '').localeCompare(b.clientType || '');
      return 0;
    });

  if (loading) {
    return <div className="text-muted-foreground">Loading clients...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-xs text-muted-foreground mt-1">{filtered.length} of {clients.length} clients</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/clients/new')}>
            <Plus size={16} className="mr-2" />
            Add Client
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone, PAN, GST, Aadhar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-0"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 bg-secondary border-0 h-9 text-xs">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CLIENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterService} onValueChange={setFilterService}>
          <SelectTrigger className="w-44 bg-secondary border-0 h-9 text-xs">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {SERVICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32 bg-secondary border-0 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="newest">Sort: Newest</SelectItem>
            <SelectItem value="oldest">Sort: Oldest</SelectItem>
            <SelectItem value="type">Sort: Type</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search || filterType !== 'all' || filterService !== 'all' ? 'No clients match your filters' : 'No clients found'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Card
              key={client._id}
              className="border-0 bg-card cursor-pointer hover:bg-secondary transition-colors group"
              onClick={() => navigate(`/clients/${client._id}`)}
            >
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {client.name}
                    </h3>
                    <Badge variant="outline" className="text-[10px] mt-1 border-muted-foreground/30">
                      {client.clientType || 'Individual'}
                    </Badge>
                  </div>
                  {canDelete && (
                    <button
                      onClick={(e) => handleDelete(e, client._id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={13} />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={13} />
                    <span>{client.phone}</span>
                  </div>
                </div>

                {(client.panNumber || client.gstNumber) && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {client.panNumber && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        PAN: {client.panNumber}
                      </span>
                    )}
                    {client.gstNumber && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        GST: {client.gstNumber}
                      </span>
                    )}
                  </div>
                )}

                {client.services?.length > 0 && (
                  <div className="mt-3 flex gap-1 flex-wrap">
                    {client.services.slice(0, 3).map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">
                        {s}
                      </Badge>
                    ))}
                    {client.services.length > 3 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{client.services.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
