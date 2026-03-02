import { useState, useEffect } from 'react';
import { complianceService } from '@/services/complianceService';
import { taskService } from '@/services/taskService';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, FileText, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DocumentChecklist({ taskType, clientId, taskId }) {
  const [checklist, setChecklist] = useState(null);
  const [taskChecklist, setTaskChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!taskType) return;
    const fetchData = async () => {
      try {
        const data = await complianceService.getChecklist(taskType, clientId);
        setChecklist(data);
      } catch (error) {
        console.error('Error fetching checklist:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [taskType, clientId]);

  const isCollected = (itemName) => {
    const taskItem = taskChecklist.find(i => i.name === itemName);
    if (taskItem) return taskItem.collected;
    const checklistItem = checklist?.items?.find(i => i.name === itemName);
    return checklistItem?.uploaded || false;
  };

  const handleToggle = async (itemName) => {
    if (!taskId) return;
    const current = isCollected(itemName);
    try {
      const updated = await taskService.updateChecklist(taskId, itemName, !current);
      setTaskChecklist(updated);
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  if (loading) return <p className="text-xs text-muted-foreground">Loading checklist...</p>;

  if (!checklist || checklist.items?.length === 0) {
    return (
      <div className="mt-2 p-3 rounded-lg bg-muted/30">
        <p className="text-xs text-muted-foreground">No document checklist defined for this task type.</p>
      </div>
    );
  }

  const collectedCount = checklist.items.filter(item => isCollected(item.name)).length;
  const requiredItems = checklist.items.filter(item => item.required);
  const requiredCollectedCount = requiredItems.filter(item => isCollected(item.name)).length;
  const optionalItems = checklist.items.filter(item => !item.required);
  const optionalCollectedCount = optionalItems.filter(item => isCollected(item.name)).length;

  return (
    <div className="mt-2 p-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={13} className="text-muted-foreground" />
        <span className="text-xs font-medium text-white">
          Document Checklist — {collectedCount}/{checklist.total} collected
        </span>
        {requiredItems.length > 0 && (
          <span className={`text-[10px] ${requiredCollectedCount === requiredItems.length ? 'text-green-500' : 'text-red-400'}`}>
            ({requiredCollectedCount}/{requiredItems.length} required)
          </span>
        )}
        <div className="flex-1 bg-muted rounded-full h-1.5 ml-2">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${checklist.total > 0 ? (collectedCount / checklist.total) * 100 : 0}%` }}
          />
        </div>
        {clientId && (
          <button
            onClick={() => navigate(`/clients/${clientId}?tab=documents`)}
            className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 shrink-0"
          >
            <Upload size={10} />
            Upload Docs
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {checklist.items.map((item, idx) => {
          const collected = isCollected(item.name);
          return (
            <button
              key={idx}
              onClick={() => handleToggle(item.name)}
              className={`flex items-center gap-2 py-1 px-1.5 rounded text-left transition-colors hover:bg-muted/50 ${taskId ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {collected ? (
                <CheckCircle2 size={13} className="text-green-500 shrink-0" />
              ) : (
                <Circle size={13} className="text-muted-foreground shrink-0" />
              )}
              <span className={`text-xs ${collected ? 'text-white' : 'text-muted-foreground'}`}>
                {item.name}
              </span>
              {item.required && !collected && (
                <Badge className="text-[8px] px-1 py-0 bg-red-500/10 text-red-500 border-0">Required</Badge>
              )}
              {item.document?.verificationStatus === 'verified' && (
                <Badge className="text-[8px] px-1 py-0 bg-green-500/10 text-green-500 border-0">Verified</Badge>
              )}
              {item.uploaded && (
                <Badge className="text-[8px] px-1 py-0 bg-blue-500/10 text-blue-400 border-0">Uploaded</Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
