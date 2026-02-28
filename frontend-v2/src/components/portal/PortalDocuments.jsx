import { useAuth } from '@/hooks/useAuth';
import DocumentRequests from '@/components/portal/DocumentRequests';
import DocumentManager from '@/components/documents/DocumentManager';

export default function PortalDocuments() {
  const { user } = useAuth();

  if (!user?.clientId) {
    return <p className="text-muted-foreground">Your account is not linked to a client profile.</p>;
  }

  return (
    <div className="space-y-8">
      <DocumentRequests />
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">All Documents</h2>
        <DocumentManager clientId={user.clientId} />
      </div>
    </div>
  );
}
