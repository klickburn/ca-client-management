import { Badge } from '@/components/ui/badge';

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  verified: { label: 'Verified', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

export default function VerificationBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge variant="outline" className={`text-[10px] ${config.className}`}>
      {config.label}
    </Badge>
  );
}
