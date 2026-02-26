import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

const emptyAccount = { bankName: '', accountNumber: '', customerId: '', password: '', accountType: '', ifscCode: '', branch: '' };

export default function BankAccountsForm({ accounts = [], onChange }) {
  const update = (index, field, value) => {
    const updated = [...accounts];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const add = () => onChange([...accounts, { ...emptyAccount }]);
  const remove = (index) => onChange(accounts.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      {accounts.map((acc, i) => (
        <div key={i} className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{acc.bankName || `Bank Account ${i + 1}`}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(i)}>
              <Trash2 size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              ['Bank Name', 'bankName'],
              ['Account Number', 'accountNumber'],
              ['Account Type', 'accountType'],
              ['IFSC Code', 'ifscCode'],
              ['Branch', 'branch'],
              ['Customer ID', 'customerId'],
              ['Password', 'password'],
            ].map(([label, field]) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input value={acc[field] || ''} onChange={(e) => update(i, field, e.target.value)} className="bg-secondary border-0 h-9" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus size={14} className="mr-1" /> Add Bank Account
      </Button>
    </div>
  );
}
