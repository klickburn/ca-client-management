import { useAuth } from '@/hooks/useAuth';
import FilingTracker from '@/components/clients/FilingTracker';

export default function MyFilings() {
  const { user } = useAuth();

  if (!user?.clientId) {
    return <p className="text-muted-foreground">Your account is not linked to a client profile.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">My Filings</h1>
      <FilingTracker clientId={user.clientId} />
    </div>
  );
}
