import { useState, useEffect, useMemo, useCallback } from 'react';
import { activityService } from '@/services/activityService';
import { userService } from '@/services/userService';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  UserPlus, Edit, Trash2, Upload, CheckCircle, XCircle,
  ListTodo, FileText, CreditCard, LogIn, Activity,
  Search, X, RefreshCw, Download, Zap,
} from 'lucide-react';

const PAGE_SIZE = 50;

const actionIcons = {
  'client:create': UserPlus, 'client:update': Edit, 'client:delete': Trash2,
  'document:upload': Upload, 'document:verify': CheckCircle, 'document:reject': XCircle, 'document:delete': Trash2,
  'task:create': ListTodo, 'task:update': Edit, 'task:complete': CheckCircle, 'task:delete': Trash2, 'task:bulk_generate': Zap,
  'invoice:create': FileText, 'invoice:update': Edit, 'invoice:delete': Trash2, 'invoice:payment': CreditCard,
  'user:create': UserPlus, 'user:update': Edit, 'user:delete': Trash2,
  'login': LogIn,
};

const actionColors = {
  'create': 'text-green-500', 'update': 'text-blue-400', 'delete': 'text-red-400',
  'upload': 'text-blue-400', 'verify': 'text-green-500', 'reject': 'text-red-400',
  'complete': 'text-green-500', 'payment': 'text-green-500', 'login': 'text-muted-foreground',
  'bulk_generate': 'text-purple-400',
};

const ACTION_FILTERS = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'complete', label: 'Complete' },
  { value: 'upload', label: 'Upload' },
  { value: 'login', label: 'Login' },
];

function getDayLabel(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const entryDate = new Date(date);
  entryDate.setHours(0, 0, 0, 0);

  if (entryDate.getTime() === today.getTime()) return 'Today';
  if (entryDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    userService.getUsers().then(setUsers).catch(() => {});
  }, []);

  const buildFilters = useCallback((skip = 0) => {
    const filters = { limit: PAGE_SIZE, skip };
    if (filterType !== 'all') filters.targetType = filterType;
    if (filterAction !== 'all') filters.action = filterAction;
    if (filterUser !== 'all') filters.performedBy = filterUser;
    if (debouncedSearch) filters.search = debouncedSearch;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    return filters;
  }, [filterType, filterAction, filterUser, debouncedSearch, dateFrom, dateTo]);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const result = await activityService.getActivities(buildFilters(0));
      setActivities(result.activities || []);
      setTotal(result.total || 0);
      setHasMore(result.hasMore || false);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [buildFilters]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const result = await activityService.getActivities(buildFilters(activities.length));
      setActivities(prev => [...prev, ...(result.activities || [])]);
      setHasMore(result.hasMore || false);
    } catch (error) {
      console.error('Error loading more:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterAction('all');
    setFilterUser('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = filterType !== 'all' || filterAction !== 'all' || filterUser !== 'all' || searchQuery || dateFrom || dateTo;

  const exportCSV = () => {
    const headers = ['Date', 'Time', 'User', 'Action', 'Details', 'Target Type'];
    const rows = activities.map(a => {
      const d = new Date(a.createdAt);
      return [
        d.toLocaleDateString('en-IN'),
        d.toLocaleTimeString('en-IN'),
        a.performedBy?.username || 'System',
        a.action,
        (a.details || '').replace(/"/g, '""'),
        a.targetType || '',
      ];
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity-log.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getIcon = (action) => actionIcons[action] || Activity;
  const getColor = (action) => {
    const suffix = action.split(':')[1] || action;
    return actionColors[suffix] || 'text-muted-foreground';
  };

  // Group activities by day
  const grouped = useMemo(() => {
    const groups = [];
    let currentDay = null;
    activities.forEach(a => {
      const day = getDayLabel(a.createdAt);
      if (day !== currentDay) {
        currentDay = day;
        groups.push({ day, items: [] });
      }
      groups[groups.length - 1].items.push(a);
    });
    return groups;
  }, [activities]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Log</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {total} total entries{activities.length < total ? `, showing ${activities.length}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={activities.length === 0}>
            <Download size={14} className="mr-1" />CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchActivities} disabled={loading}>
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity..."
            className="w-52 bg-secondary border-0 h-8 text-xs pl-8"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 bg-secondary border-0 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Client">Clients</SelectItem>
            <SelectItem value="Task">Tasks</SelectItem>
            <SelectItem value="Invoice">Invoices</SelectItem>
            <SelectItem value="Document">Documents</SelectItem>
            <SelectItem value="User">Users</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-32 bg-secondary border-0 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTION_FILTERS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-36 bg-secondary border-0 h-8 text-xs"><SelectValue placeholder="All Users" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map(u => <SelectItem key={u._id} value={u._id}>{u.username}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="w-36 bg-secondary border-0 h-8 text-xs" title="From date"
        />
        <Input
          type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="w-36 bg-secondary border-0 h-8 text-xs" title="To date"
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={clearFilters}>
            <X size={13} className="mr-1" />Clear
          </Button>
        )}
      </div>

      {/* Activity List */}
      {loading && activities.length === 0 ? (
        <div className="text-muted-foreground">Loading activity...</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {hasFilters ? 'No activity matching your filters.' : 'No activity recorded yet.'}
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={clearFilters}>Clear filters</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.day}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">{group.day}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground">{group.items.length} event{group.items.length !== 1 ? 's' : ''}</span>
              </div>
              <Card className="border-0 bg-card">
                <CardContent className="pt-2 pb-2">
                  {group.items.map((activity) => {
                    const Icon = getIcon(activity.action);
                    const color = getColor(activity.action);
                    const time = new Date(activity.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={activity._id} className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`mt-0.5 ${color}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{activity.details || activity.action}</p>
                          <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{activity.performedBy?.username || 'System'}</span>
                            {activity.performedBy?.role && (
                              <span className="text-muted-foreground/60">{activity.performedBy.role}</span>
                            )}
                            {activity.targetType && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 border-muted-foreground/30">
                                {activity.targetType}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0" title={new Date(activity.createdAt).toLocaleString()}>
                          {time}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center py-2">
              <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : `Load more (${activities.length} of ${total})`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
