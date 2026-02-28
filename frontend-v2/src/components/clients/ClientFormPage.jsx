import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import BasicInfoForm from './forms/BasicInfoForm';
import AddressForm from './forms/AddressForm';
import IdentityForm from './forms/IdentityForm';
import CredentialsForm from './forms/CredentialsForm';
import BankAccountsForm from './forms/BankAccountsForm';
import LoanAccountsForm from './forms/LoanAccountsForm';
import DematAccountsForm from './forms/DematAccountsForm';
import ServicesNotesForm from './forms/ServicesNotesForm';
import { ArrowLeft, Save, Copy, Check, UserPlus } from 'lucide-react';

const initialState = {
  name: '', email: '', phone: '', address: '', dateOfBirth: '',
  clientType: 'Individual', addresses: [], panNumber: '', aadharNumber: '',
  gstNumber: '', tanNumber: '', credentials: {}, bankAccounts: [],
  loanAccounts: [], dematAccounts: [], services: [], notes: '',
};

export default function ClientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [credentialsDialog, setCredentialsDialog] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (isEdit) {
      clientService.getClient(id).then((data) => {
        setFormData(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEdit]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit) {
        await clientService.updateClient(id, formData);
        navigate('/clients');
      } else {
        const result = await clientService.createClient(formData);
        if (result.portalCredentials) {
          setCredentialsDialog(result.portalCredentials);
        } else {
          navigate('/clients');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const updateBasic = (data) => setFormData((prev) => ({ ...prev, ...data }));

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold text-white">
          {isEdit ? 'Edit Client' : 'New Client'}
        </h1>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="identity">ID Documents</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="banking">Banking</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card className="border-0 bg-card">
              <CardContent className="pt-6 space-y-6">
                <BasicInfoForm data={formData} onChange={updateBasic} />
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Additional Addresses</h3>
                  <AddressForm
                    addresses={formData.addresses}
                    onChange={(addresses) => setFormData((prev) => ({ ...prev, addresses }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="identity">
            <Card className="border-0 bg-card">
              <CardContent className="pt-6">
                <IdentityForm data={formData} onChange={updateBasic} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credentials">
            <Card className="border-0 bg-card">
              <CardContent className="pt-6">
                <CredentialsForm
                  credentials={formData.credentials}
                  onChange={(credentials) => setFormData((prev) => ({ ...prev, credentials }))}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banking">
            <Card className="border-0 bg-card">
              <CardContent className="pt-6 space-y-8">
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Bank Accounts</h3>
                  <BankAccountsForm
                    accounts={formData.bankAccounts}
                    onChange={(bankAccounts) => setFormData((prev) => ({ ...prev, bankAccounts }))}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Loan Accounts</h3>
                  <LoanAccountsForm
                    accounts={formData.loanAccounts}
                    onChange={(loanAccounts) => setFormData((prev) => ({ ...prev, loanAccounts }))}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Demat Accounts</h3>
                  <DematAccountsForm
                    accounts={formData.dematAccounts}
                    onChange={(dematAccounts) => setFormData((prev) => ({ ...prev, dematAccounts }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card className="border-0 bg-card">
              <CardContent className="pt-6">
                <ServicesNotesForm
                  services={formData.services}
                  notes={formData.notes}
                  onServicesChange={(services) => setFormData((prev) => ({ ...prev, services }))}
                  onNotesChange={(notes) => setFormData((prev) => ({ ...prev, notes }))}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
          </Button>
        </div>
      </form>

      {/* Portal Credentials Dialog */}
      <Dialog open={!!credentialsDialog} onOpenChange={() => { setCredentialsDialog(null); navigate('/clients'); }}>
        <DialogContent className="bg-card border-0 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <UserPlus size={18} className="text-green-500" />
              Client Portal Account Created
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              A portal login has been automatically created for this client. Share these credentials with them so they can access their portal.
            </p>
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Username</p>
                  <p className="text-sm font-mono text-white">{credentialsDialog?.username}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(credentialsDialog?.username, 'username')}>
                  {copied === 'username' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Password</p>
                  <p className="text-sm font-mono text-white">{credentialsDialog?.password}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(credentialsDialog?.password, 'password')}>
                  {copied === 'password' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-yellow-500">
              Save these credentials now — the password cannot be retrieved later.
            </p>
            <Button className="w-full" onClick={() => { setCredentialsDialog(null); navigate('/clients'); }}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
