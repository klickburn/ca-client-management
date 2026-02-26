import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService } from '@/services/clientService';
import { usePermission } from '@/hooks/usePermission';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import DocumentManager from '@/components/documents/DocumentManager';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar } from 'lucide-react';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}

function CredentialCard({ title, username, password }) {
  const [showPassword, setShowPassword] = useState(false);
  if (!username && !password) return null;
  return (
    <div className="bg-muted rounded-lg p-4 space-y-2">
      <h4 className="text-sm font-medium text-white">{title}</h4>
      <InfoRow label="Username" value={username} />
      <div className="flex justify-between py-2">
        <span className="text-sm text-muted-foreground">Password</span>
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="text-sm text-primary hover:text-primary/80"
        >
          {showPassword ? password || '--' : 'Click to reveal'}
        </button>
      </div>
    </div>
  );
}

function AccountCard({ title, fields }) {
  return (
    <div className="bg-muted rounded-lg p-4 space-y-1">
      <h4 className="text-sm font-medium text-white mb-2">{title}</h4>
      {fields.map(([label, value]) => (
        <InfoRow key={label} label={label} value={value} />
      ))}
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canEdit = usePermission('client:edit');
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const data = await clientService.getClient(id);
        setClient(data);
      } catch (error) {
        console.error('Error fetching client:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [id]);

  if (loading) return <div className="text-muted-foreground">Loading...</div>;
  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Mail size={13} /> {client.email}</span>
              <span className="flex items-center gap-1"><Phone size={13} /> {client.phone}</span>
            </div>
          </div>
        </div>
        {canEdit && (
          <Button variant="secondary" onClick={() => navigate(`/clients/${id}/edit`)}>
            <Edit size={16} className="mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="identity">ID Documents</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Basic Info */}
        <TabsContent value="basic">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 bg-card">
              <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Email" value={client.email} />
                <InfoRow label="Phone" value={client.phone} />
                <InfoRow label="Address" value={client.address} />
                <InfoRow label="Date of Birth" value={client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString() : null} />
              </CardContent>
            </Card>

            <Card className="border-0 bg-card">
              <CardHeader><CardTitle className="text-base">Business</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Client Type" value={client.clientType} />
                {client.services?.length > 0 && (
                  <div className="py-2">
                    <span className="text-sm text-muted-foreground block mb-2">Services</span>
                    <div className="flex gap-1 flex-wrap">
                      {client.services.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {client.notes && <InfoRow label="Notes" value={client.notes} />}
              </CardContent>
            </Card>

            {client.addresses?.length > 0 && (
              <Card className="border-0 bg-card md:col-span-2">
                <CardHeader><CardTitle className="text-base">Addresses</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {client.addresses.map((addr, i) => (
                      <div key={i} className="bg-muted rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin size={14} className="text-primary" />
                          <span className="text-sm font-medium text-white">{addr.addressType}</span>
                          {addr.isPrimary && <Badge className="text-[10px]">Primary</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {addr.streetAddress}, {addr.city}, {addr.state} - {addr.postalCode}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ID Documents */}
        <TabsContent value="identity">
          <Card className="border-0 bg-card">
            <CardHeader><CardTitle className="text-base">Government IDs</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <InfoRow label="PAN Number" value={client.panNumber} />
              <InfoRow label="Aadhar Number" value={client.aadharNumber} />
              <InfoRow label="GST Number" value={client.gstNumber} />
              <InfoRow label="TAN Number" value={client.tanNumber} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credentials */}
        <TabsContent value="credentials">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CredentialCard title="Income Tax Portal" username={client.credentials?.incomeTax?.username} password={client.credentials?.incomeTax?.password} />
            <CredentialCard title="GST Portal" username={client.credentials?.gst?.username} password={client.credentials?.gst?.password} />
            <CredentialCard title="TAN Portal" username={client.credentials?.tan?.username} password={client.credentials?.tan?.password} />
            <CredentialCard title="TRACES Portal" username={client.credentials?.traces?.username} password={client.credentials?.traces?.password} />
          </div>
        </TabsContent>

        {/* Accounts */}
        <TabsContent value="accounts">
          <div className="space-y-6">
            {client.bankAccounts?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Bank Accounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {client.bankAccounts.map((acc, i) => (
                    <AccountCard key={i} title={acc.bankName || `Bank Account ${i + 1}`} fields={[
                      ['Account Number', acc.accountNumber],
                      ['Account Type', acc.accountType],
                      ['IFSC Code', acc.ifscCode],
                      ['Branch', acc.branch],
                      ['Customer ID', acc.customerId],
                    ]} />
                  ))}
                </div>
              </div>
            )}

            {client.loanAccounts?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Loan Accounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {client.loanAccounts.map((acc, i) => (
                    <AccountCard key={i} title={acc.lenderName || `Loan ${i + 1}`} fields={[
                      ['Loan Type', acc.loanType],
                      ['Account Number', acc.accountNumber],
                      ['Amount', acc.amount?.toLocaleString()],
                      ['Interest Rate', acc.interestRate],
                      ['EMI', acc.emiAmount?.toLocaleString()],
                    ]} />
                  ))}
                </div>
              </div>
            )}

            {client.dematAccounts?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Demat Accounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {client.dematAccounts.map((acc, i) => (
                    <AccountCard key={i} title={acc.brokerName || `Demat ${i + 1}`} fields={[
                      ['Account Number', acc.accountNumber],
                      ['Username', acc.username],
                    ]} />
                  ))}
                </div>
              </div>
            )}

            {!client.bankAccounts?.length && !client.loanAccounts?.length && !client.dematAccounts?.length && (
              <div className="text-center py-12 text-muted-foreground">No accounts found</div>
            )}
          </div>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <DocumentManager clientId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
