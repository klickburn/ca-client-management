import { useState, useEffect } from 'react';
import { activityService } from '@/services/activityService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  UserPlus, Edit, Trash2, Upload, CheckCircle, XCircle,
  ListTodo, FileText, CreditCard, LogIn, Activity,
} from 'lucide-react';

const actionIcons = {
  'client:create': UserPlus, 'client:update': Edit, 'client:delete': Trash2,
  'document:upload': Upload, 'document:verify': CheckCircle, 'document:reject': XCircle, 'document:delete': Trash2,
  'task:create': ListTodo, 'task:update': Edit, 'task:complete': CheckCircle, 'task:delete': Trash2,
  'invoice:create': FileText, 'invoice:update': Edit, 'invoice:delete': Trash2, 'invoice:payment': CreditCard,
  'user:create': UserPlus, 'user:update': Edit, 'user:delete': Trash2,
  'login': LogIn,
};

const actionColors = {
  'create': 'text-green-500', 'update': 'text-blue-400', 'delete': 'text-red-400',
  'upload': 'text-blue-400', 'verify': 'text-green-500', 'reject': 'text-red-400',
  'complete': 'text-green-500', 'payment': 'text-green-500', 'login': 'text-muted-foreground',
};

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => { fetchActivities(); }, [filterType]);

  const fetchActivities = async () => {
    try {
      const filters = { limit: 100 };
      if (filterType !== 'all') filters.targetType = filterType;
      const data = await activityService.getActivities(filters);
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (action) => actionIcons[action] || Activity;
  const getColor = (action) => {
    const suffix = action.split(':')[1];
    return actionColors[suffix] || 'text-muted-foreground';
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) return <div className="text-muted-foreground">Loading activity...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 bg-secondary border-0 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="Client">Clients</SelectItem>
            <SelectItem value="Task">Tasks</SelectItem>
            <SelectItem value="Invoice">Invoices</SelectItem>
            <SelectItem value="Document">Documents</SelectItem>
            <SelectItem value="User">Users</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 bg-card">
        <CardContent className="pt-4">
          {activities.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No activity recorded yet</p>
          ) : (
            <div className="space-y-1">
              {activities.map((activity) => {
                const Icon = getIcon(activity.action);
                const color = getColor(activity.action);
                return (
                  <div key={activity._id} className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`mt-0.5 ${color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{activity.details}</p>
                      <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{activity.performedBy?.username}</span>
                        {activity.targetType && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-muted-foreground/30">
                            {activity.targetType}
                          </Badge>
                        )}
                        <span>{timeAgo(activity.createdAt)}</span>
                      </div>
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
