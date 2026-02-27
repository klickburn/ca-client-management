import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle } from 'lucide-react';

// PAN format: AAAAA9999A — 5 letters, 4 digits, 1 letter
// 4th char indicates type: P=Individual, C=Company, H=HUF, F=Firm, A=AOP, T=Trust, etc.
function validatePAN(pan) {
  if (!pan) return null;
  const regex = /^[A-Z]{3}[ABCFGHLJPT][A-Z]\d{4}[A-Z]$/;
  const valid = regex.test(pan.toUpperCase());
  const typeMap = { A: 'AOP', B: 'BOI', C: 'Company', F: 'Firm/LLP', G: 'Govt', H: 'HUF', J: 'AJP', L: 'Local Auth', P: 'Individual', T: 'Trust' };
  return { valid, type: valid ? typeMap[pan.charAt(3)] || '' : '' };
}

// GSTIN format: 2-digit state code + PAN (10 chars) + entity number + Z + checksum
function validateGSTIN(gstin) {
  if (!gstin) return null;
  const regex = /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d][A-Z\d]$/;
  const valid = regex.test(gstin.toUpperCase());
  const stateCodes = { '01': 'J&K', '02': 'HP', '03': 'PB', '04': 'CH', '05': 'UK', '06': 'HR', '07': 'DL', '08': 'RJ', '09': 'UP', '10': 'BR', '11': 'SK', '12': 'AR', '13': 'NL', '14': 'MN', '15': 'MZ', '16': 'TR', '17': 'ML', '18': 'AS', '19': 'WB', '20': 'JH', '21': 'OD', '22': 'CG', '23': 'MP', '24': 'GJ', '26': 'DNH', '27': 'MH', '29': 'KA', '30': 'GA', '32': 'KL', '33': 'TN', '34': 'PY', '36': 'TS', '37': 'AP' };
  const state = valid ? stateCodes[gstin.substring(0, 2)] || '' : '';
  const pan = valid ? gstin.substring(2, 12) : '';
  return { valid, state, pan };
}

function ValidationIcon({ result }) {
  if (!result) return null;
  return result.valid
    ? <CheckCircle2 size={14} className="text-green-500" />
    : <XCircle size={14} className="text-red-500" />;
}

export default function IdentityForm({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const panResult = validatePAN(data.panNumber);
  const gstResult = validateGSTIN(data.gstNumber);

  // If GSTIN is valid and PAN is empty, auto-fill PAN from GSTIN
  const handleGSTChange = (value) => {
    const upper = value.toUpperCase();
    update('gstNumber', upper);
    if (upper.length === 15 && !data.panNumber) {
      const gst = validateGSTIN(upper);
      if (gst?.valid && gst.pan) {
        onChange({ ...data, gstNumber: upper, panNumber: gst.pan });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          PAN Number
          <ValidationIcon result={panResult} />
          {panResult?.valid && <span className="text-[10px] text-muted-foreground">({panResult.type})</span>}
        </Label>
        <Input
          value={data.panNumber || ''}
          onChange={(e) => update('panNumber', e.target.value.toUpperCase())}
          className={`bg-secondary border-0 ${panResult && !panResult.valid && data.panNumber?.length === 10 ? 'ring-1 ring-red-500' : ''}`}
          placeholder="AAAPZ1234C"
          maxLength={10}
        />
        {panResult && !panResult.valid && data.panNumber?.length >= 10 && (
          <p className="text-[11px] text-red-500">Invalid PAN format. Expected: 5 letters, 4 digits, 1 letter (4th char must be entity type)</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Aadhar Number</Label>
        <Input value={data.aadharNumber || ''} onChange={(e) => update('aadharNumber', e.target.value.replace(/\D/g, ''))} className="bg-secondary border-0" placeholder="1234 5678 9012" maxLength={12} />
        {data.aadharNumber && data.aadharNumber.length > 0 && data.aadharNumber.length < 12 && (
          <p className="text-[11px] text-muted-foreground">Aadhar must be 12 digits</p>
        )}
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          GST Number
          <ValidationIcon result={gstResult} />
          {gstResult?.valid && <span className="text-[10px] text-muted-foreground">({gstResult.state})</span>}
        </Label>
        <Input
          value={data.gstNumber || ''}
          onChange={(e) => handleGSTChange(e.target.value)}
          className={`bg-secondary border-0 ${gstResult && !gstResult.valid && data.gstNumber?.length === 15 ? 'ring-1 ring-red-500' : ''}`}
          placeholder="22AAAAA0000A1Z5"
          maxLength={15}
        />
        {gstResult?.valid && gstResult.pan && (
          <p className="text-[11px] text-green-500">PAN from GSTIN: {gstResult.pan}</p>
        )}
        {gstResult && !gstResult.valid && data.gstNumber?.length >= 15 && (
          <p className="text-[11px] text-red-500">Invalid GSTIN format</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>TAN Number</Label>
        <Input value={data.tanNumber || ''} onChange={(e) => update('tanNumber', e.target.value.toUpperCase())} className="bg-secondary border-0" placeholder="DELA12345A" maxLength={10} />
      </div>
    </div>
  );
}
