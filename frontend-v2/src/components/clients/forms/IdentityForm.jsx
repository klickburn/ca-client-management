import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function IdentityForm({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>PAN Number</Label>
        <Input value={data.panNumber || ''} onChange={(e) => update('panNumber', e.target.value.toUpperCase())} className="bg-secondary border-0" placeholder="AAAPZ1234C" maxLength={10} />
      </div>
      <div className="space-y-2">
        <Label>Aadhar Number</Label>
        <Input value={data.aadharNumber || ''} onChange={(e) => update('aadharNumber', e.target.value)} className="bg-secondary border-0" placeholder="1234 5678 9012" maxLength={12} />
      </div>
      <div className="space-y-2">
        <Label>GST Number</Label>
        <Input value={data.gstNumber || ''} onChange={(e) => update('gstNumber', e.target.value.toUpperCase())} className="bg-secondary border-0" placeholder="22AAAAA0000A1Z5" maxLength={15} />
      </div>
      <div className="space-y-2">
        <Label>TAN Number</Label>
        <Input value={data.tanNumber || ''} onChange={(e) => update('tanNumber', e.target.value.toUpperCase())} className="bg-secondary border-0" placeholder="DELA12345A" maxLength={10} />
      </div>
    </div>
  );
}
