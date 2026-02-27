import { useState, useEffect, useRef } from 'react';
import { documentService } from '@/services/documentService';
import { usePermission } from '@/hooks/usePermission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import VerificationBadge from './VerificationBadge';
import { Upload, Download, Trash2, CheckCircle, XCircle, Files } from 'lucide-react';

const CATEGORIES = ['Statement', 'Ledgers', 'Financials', 'Returns', 'Vendor Registration', 'Property Details', 'Other'];
const FISCAL_YEARS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022', '2020-2021'];

export default function DocumentManager({ clientId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1);
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState('Other');
  const [fiscalYear, setFiscalYear] = useState('');
  const [notes, setNotes] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  const canUpload = usePermission('document:upload');
  const canVerify = usePermission('document:verify');
  const canDelete = usePermission('document:delete');

  useEffect(() => {
    fetchDocuments();
  }, [clientId, filterCategory, filterYear]);

  const fetchDocuments = async () => {
    try {
      const data = await documentService.getDocuments(clientId, {
        category: filterCategory,
        fiscalYear: filterYear,
      });
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadQueue(files.map(f => ({ name: f.name, status: 'pending' })));

    for (let i = 0; i < files.length; i++) {
      setCurrentUploadIndex(i);
      setUploadQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'uploading' } : q));

      try {
        await documentService.uploadDocument(
          clientId, files[i], { category, fiscalYear, notes },
          (progress) => setUploadProgress(progress)
        );
        setUploadQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'done' } : q));
      } catch (error) {
        console.error(`Upload failed for ${files[i].name}:`, error);
        setUploadQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'error' } : q));
      }
    }

    setFiles([]);
    setNotes('');
    setUploading(false);
    setUploadProgress(0);
    setCurrentUploadIndex(-1);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setUploadQueue([]), 2000);
    fetchDocuments();
  };

  const handleVerify = async (docId) => {
    try {
      await documentService.verifyDocument(clientId, docId);
      fetchDocuments();
    } catch (error) {
      console.error('Verify failed:', error);
    }
  };

  const handleReject = async (docId) => {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await documentService.rejectDocument(clientId, docId, reason);
      fetchDocuments();
    } catch (error) {
      console.error('Reject failed:', error);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document?')) return;
    try {
      await documentService.deleteDocument(clientId, docId);
      fetchDocuments();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocs = documents.filter(doc => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return doc.name?.toLowerCase().includes(q) || doc.category?.toLowerCase().includes(q) || doc.notes?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Upload */}
      {canUpload && (
        <Card className="border-0 bg-card">
          <CardHeader><CardTitle className="text-base">Upload Documents</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Files {files.length > 1 && `(${files.length} selected)`}</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="bg-secondary border-0"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.csv,.zip"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fiscal Year</Label>
                  <Select value={fiscalYear} onValueChange={setFiscalYear}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      {FISCAL_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" className="bg-secondary border-0" />
              </div>

              {/* Upload Queue */}
              {uploadQueue.length > 0 && (
                <div className="space-y-1">
                  {uploadQueue.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${q.status === 'done' ? 'bg-green-500' : q.status === 'error' ? 'bg-red-500' : q.status === 'uploading' ? 'bg-blue-500 animate-pulse' : 'bg-muted-foreground'}`} />
                      <span className="text-muted-foreground truncate">{q.name}</span>
                      {q.status === 'uploading' && <span className="text-primary">{uploadProgress}%</span>}
                      {q.status === 'done' && <span className="text-green-500">Done</span>}
                      {q.status === 'error' && <span className="text-red-500">Failed</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4">
                <Button type="submit" disabled={files.length === 0 || uploading}>
                  {files.length > 1 ? <Files size={16} className="mr-2" /> : <Upload size={16} className="mr-2" />}
                  {uploading ? `Uploading ${currentUploadIndex + 1}/${files.length}` : files.length > 1 ? `Upload ${files.length} Files` : 'Upload'}
                </Button>
                {uploading && (
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter & List */}
      <Card className="border-0 bg-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Documents ({filteredDocs.length})</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-40 bg-secondary border-0 h-8 text-xs"
              />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40 bg-secondary border-0 h-8 text-xs"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-36 bg-secondary border-0 h-8 text-xs"><SelectValue placeholder="All years" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {FISCAL_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredDocs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No documents found</p>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map((doc) => (
                <div
                  key={doc._id}
                  className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{doc.name}</span>
                      <VerificationBadge status={doc.verificationStatus} />
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{doc.category}</span>
                      {doc.fiscalYear && <span>{doc.fiscalYear}</span>}
                      <span>{formatSize(doc.size)}</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canVerify && doc.verificationStatus === 'pending' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={() => handleVerify(doc._id)}>
                          <CheckCircle size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleReject(doc._id)}>
                          <XCircle size={15} />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => documentService.downloadDocument(clientId, doc._id)}>
                      <Download size={15} />
                    </Button>
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc._id)}>
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
