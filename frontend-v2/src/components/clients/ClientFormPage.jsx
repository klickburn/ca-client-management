import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BasicInfoForm from './forms/BasicInfoForm';
import AddressForm from './forms/AddressForm';
import IdentityForm from './forms/IdentityForm';
import CredentialsForm from './forms/CredentialsForm';
import BankAccountsForm from './forms/BankAccountsForm';
import LoanAccountsForm from './forms/LoanAccountsForm';
import DematAccountsForm from './forms/DematAccountsForm';
import ServicesNotesForm from './forms/ServicesNotesForm';
import { ArrowLeft, Save } from 'lucide-react';

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

  useEffect(() => {
    if (isEdit) {
      clientService.getClient(id).then((data) => {
        setFormData(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit) {
        await clientService.updateClient(id, formData);
      } else {
        await clientService.createClient(formData);
      }
      navigate('/clients');
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
    </div>
  );
}
