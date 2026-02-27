import { useState, useEffect } from 'react';
import { complianceService } from '@/services/complianceService';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, FileText } from 'lucide-react';

export default function DocumentChecklist({ taskType, clientId }) {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskType) return;
    const fetch = async () => {
      try {
        const data = await complianceService.getChecklist(taskType, clientId);
        setChecklist(data);
      } catch (error) {
        console.error('Error fetching checklist:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [taskType, clientId]);

  if (loading) return <p className="text-xs text-muted-foreground">Loading checklist...</p>;
  if (!checklist || checklist.items?.length === 0) return null;

  return (
    <div className="mt-2 p-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={13} className="text-muted-foreground" />
        <span className="text-xs font-medium text-white">
          Document Checklist — {checklist.collected}/{checklist.total} collected
        </span>
        <div className="flex-1 bg-muted rounded-full h-1.5 ml-2">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${checklist.total > 0 ? (checklist.collected / checklist.total) * 100 : 0}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {checklist.items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 py-0.5">
            {item.uploaded ? (
              <CheckCircle2 size={12} className="text-green-500 shrink-0" />
            ) : (
              <Circle size={12} className="text-muted-foreground shrink-0" />
            )}
            <span className={`text-xs ${item.uploaded ? 'text-white' : 'text-muted-foreground'}`}>
              {item.name}
            </span>
            {item.required && !item.uploaded && (
              <Badge className="text-[8px] px-1 py-0 bg-red-500/10 text-red-500 border-0">Required</Badge>
            )}
            {item.document?.verificationStatus === 'verified' && (
              <Badge className="text-[8px] px-1 py-0 bg-green-500/10 text-green-500 border-0">Verified</Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
