import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { clientService } from '@/services/clientService';
import { userService } from '@/services/userService';
import StatCard from './StatCard';
import { Users, UserCircle, FileText } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const canViewFull = usePermission('dashboard:full');
  const canManageTeam = usePermission('team:manage');
  const [stats, setStats] = useState({ clients: 0, users: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const clients = await clientService.getClients();
        setStats((prev) => ({ ...prev, clients: clients.length }));

        if (canManageTeam) {
          const users = await userService.getUsers();
          setStats((prev) => ({ ...prev, users: users.length }));
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, [canManageTeam]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.username}
        </p>
      </div>

      {canViewFull && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Clients" value={stats.clients} icon={Users} />
          {canManageTeam && (
            <StatCard title="Team Members" value={stats.users} icon={UserCircle} />
          )}
          <StatCard title="Documents" value="--" icon={FileText} />
        </div>
      )}

      {!canViewFull && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard title="Your Clients" value={stats.clients} icon={Users} />
        </div>
      )}
    </div>
  );
}
