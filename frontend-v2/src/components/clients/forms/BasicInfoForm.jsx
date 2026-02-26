import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const CLIENT_TYPES = ['Individual', 'Partnership', 'LLP', 'Pvt Ltd', 'Public Ltd', 'HUF', 'Other'];

export default function BasicInfoForm({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input value={data.name || ''} onChange={(e) => update('name', e.target.value)} className="bg-secondary border-0" required />
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input type="email" value={data.email || ''} onChange={(e) => update('email', e.target.value)} className="bg-secondary border-0" required />
        </div>
        <div className="space-y-2">
          <Label>Phone *</Label>
          <Input value={data.phone || ''} onChange={(e) => update('phone', e.target.value)} className="bg-secondary border-0" required />
        </div>
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <Input type="date" value={data.dateOfBirth?.split('T')[0] || ''} onChange={(e) => update('dateOfBirth', e.target.value)} className="bg-secondary border-0" />
        </div>
        <div className="space-y-2">
          <Label>Address *</Label>
          <Input value={data.address || ''} onChange={(e) => update('address', e.target.value)} className="bg-secondary border-0" required />
        </div>
        <div className="space-y-2">
          <Label>Client Type</Label>
          <Select value={data.clientType || 'Individual'} onValueChange={(v) => update('clientType', v)}>
            <SelectTrigger className="bg-secondary border-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CLIENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
