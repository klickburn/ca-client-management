import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { docRequestService } from '@/services/docRequestService';
import { documentService } from '@/services/documentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText, CheckCircle2, Circle, Upload, Loader2, AlertTriangle,
} from 'lucide-react';

const CATEGORIES = ['Statement', 'Ledgers', 'Financials', 'Returns', 'Vendor Registration', 'Property Details', 'Other'];

export default function DocumentRequests() {
  const { user } = useAuth();
  const clientId = user?.clientId;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialog, setUploadDialog] = useState(null); // { requestId, itemIndex, docName, category }
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (clientId) fetchRequests();
  }, [clientId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await docRequestService.getRequests(clientId);
      setRequests(data);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadDialog) return;
    setUploading(true);
    try {
      // Upload the document using convenience method
      const documentId = await documentService.uploadDocument(clientId, selectedFile, {
        category: uploadDialog.category || 'Other',
        notes: `Uploaded for: ${uploadDialog.docName}`,
      });

      // Mark the request item as fulfilled
      await docRequestService.fulfillItem(uploadDialog.requestId, uploadDialog.itemIndex, documentId);

      setUploadDialog(null);
      setSelectedFile(null);
      await fetchRequests();
    } catch (err) {
      console.error('Error uploading:', err);
    } finally {
      setUploading(false);
    }
  };

  if (!clientId) {
    return <p className="text-muted-foreground">Your account is not linked to a client profile.</p>;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  const pending = requests.filter(r => r.status !== 'fulfilled');
  const completed = requests.filter(r => r.status === 'fulfilled');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Document Requests</h1>

      {pending.length === 0 && completed.length === 0 ? (
        <Card className="border-0 bg-card">
          <CardContent className="py-12 text-center">
            <FileText size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No document requests yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pending Requests */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Pending Requests</h2>
              {pending.map(req => (
                <RequestCard
                  key={req._id}
                  request={req}
                  onUpload={(itemIndex) => setUploadDialog({
                    requestId: req._id,
                    itemIndex,
                    docName: req.documents[itemIndex].name,
                    category: req.documents[itemIndex].category,
                  })}
                />
              ))}
            </div>
          )}

          {/* Completed Requests */}
          {completed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Completed</h2>
              {completed.map(req => (
                <RequestCard key={req._id} request={req} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={!!uploadDialog} onOpenChange={() => { setUploadDialog(null); setSelectedFile(null); }}>
        <DialogContent className="bg-card border-0 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Upload: {uploadDialog?.docName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs">Select File</Label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="bg-secondary border-0 text-xs"
              />
            </div>
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full h-8 text-xs"
            >
              {uploading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Upload size={14} className="mr-1" />}
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestCard({ request, onUpload }) {
  const fulfilled = request.documents.filter(d => d.fulfilled).length;
  const total = request.documents.length;
  const isComplete = request.status === 'fulfilled';
  const isOverdue = request.dueDate && new Date(request.dueDate) < new Date() && !isComplete;

  return (
    <Card className="border-0 bg-card">
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-white">{request.title}</h3>
            {request.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{request.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {request.dueDate && (
              <span className={`text-[11px] ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                Due: {new Date(request.dueDate).toLocaleDateString()}
              </span>
            )}
            <Badge className={`text-[10px] border-0 ${isComplete ? 'bg-green-500/10 text-green-500' : isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
              {fulfilled}/{total}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-1 mb-3">
          <div className={`h-1 rounded-full ${isComplete ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${total ? (fulfilled / total) * 100 : 0}%` }} />
        </div>

        {/* Document checklist */}
        <div className="space-y-1.5">
          {request.documents.map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30">
              <div className="flex items-center gap-2">
                {doc.fulfilled ? (
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                ) : (
                  <Circle size={14} className="text-muted-foreground shrink-0" />
                )}
                <span className={`text-xs ${doc.fulfilled ? 'text-muted-foreground line-through' : 'text-white'}`}>
                  {doc.name}
                </span>
                {doc.required && !doc.fulfilled && (
                  <Badge className="text-[9px] px-1 py-0 bg-red-500/10 text-red-500 border-0">Required</Badge>
                )}
              </div>
              {!doc.fulfilled && onUpload && (
                <Button variant="ghost" size="sm" className="h-6 text-[11px] text-primary" onClick={() => onUpload(idx)}>
                  <Upload size={12} className="mr-1" /> Upload
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
