import { useState, useEffect } from 'react';
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
import { Upload, Download, Trash2, CheckCircle, XCircle } from 'lucide-react';

const CATEGORIES = ['Statement', 'Ledgers', 'Financials', 'Returns', 'Vendor Registration', 'Property Details', 'Other'];
const FISCAL_YEARS = ['2024-2025', '2023-2024', '2022-2023', '2021-2022', '2020-2021'];

export default function DocumentManager({ clientId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('Other');
  const [fiscalYear, setFiscalYear] = useState('');
  const [notes, setNotes] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterYear, setFilterYear] = useState('');

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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      await documentService.uploadDocument(clientId, file, { category, fiscalYear, notes }, setUploadProgress);
      setFile(null);
      setNotes('');
      fetchDocuments();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
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

  return (
    <div className="space-y-6">
      {/* Upload */}
      {canUpload && (
        <Card className="border-0 bg-card">
          <CardHeader><CardTitle className="text-base">Upload Document</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>File</Label>
                  <Input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="bg-secondary border-0"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-secondary border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fiscal Year</Label>
                  <Select value={fiscalYear} onValueChange={setFiscalYear}>
                    <SelectTrigger className="bg-secondary border-0">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {FISCAL_YEARS.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about this document"
                  className="bg-secondary border-0"
                />
              </div>
              <div className="flex items-center gap-4">
                <Button type="submit" disabled={!file || uploading}>
                  <Upload size={16} className="mr-2" />
                  {uploading ? `Uploading ${uploadProgress}%` : 'Upload'}
                </Button>
                {uploading && (
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Documents</CardTitle>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40 bg-secondary border-0 h-8 text-xs">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-36 bg-secondary border-0 h-8 text-xs">
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {FISCAL_YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : documents.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No documents found</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
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
