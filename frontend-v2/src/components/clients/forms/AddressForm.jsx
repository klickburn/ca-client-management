import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

const emptyAddress = { addressType: 'Home', streetAddress: '', city: '', state: '', postalCode: '', isPrimary: false };

export default function AddressForm({ addresses = [], onChange }) {
  const update = (index, field, value) => {
    const updated = [...addresses];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const add = () => onChange([...addresses, { ...emptyAddress }]);
  const remove = (index) => onChange(addresses.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      {addresses.map((addr, i) => (
        <div key={i} className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Address {i + 1}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(i)}>
              <Trash2 size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={addr.addressType || 'Home'} onValueChange={(v) => update(i, 'addressType', v)}>
                <SelectTrigger className="bg-secondary border-0 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Street Address</Label>
              <Input value={addr.streetAddress || ''} onChange={(e) => update(i, 'streetAddress', e.target.value)} className="bg-secondary border-0 h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">City</Label>
              <Input value={addr.city || ''} onChange={(e) => update(i, 'city', e.target.value)} className="bg-secondary border-0 h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">State</Label>
              <Input value={addr.state || ''} onChange={(e) => update(i, 'state', e.target.value)} className="bg-secondary border-0 h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Postal Code</Label>
              <Input value={addr.postalCode || ''} onChange={(e) => update(i, 'postalCode', e.target.value)} className="bg-secondary border-0 h-9" />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus size={14} className="mr-1" /> Add Address
      </Button>
    </div>
  );
}
