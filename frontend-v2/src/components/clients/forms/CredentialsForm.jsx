import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function PortalCredential({ title, username, password, onUsernameChange, onPasswordChange }) {
  return (
    <div className="bg-muted rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-medium text-white">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Username</Label>
          <Input value={username || ''} onChange={(e) => onUsernameChange(e.target.value)} className="bg-secondary border-0 h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Password</Label>
          <Input value={password || ''} onChange={(e) => onPasswordChange(e.target.value)} className="bg-secondary border-0 h-9" />
        </div>
      </div>
    </div>
  );
}

export default function CredentialsForm({ credentials = {}, onChange }) {
  const update = (portal, field, value) => {
    onChange({
      ...credentials,
      [portal]: { ...credentials[portal], [field]: value },
    });
  };

  const portals = [
    { key: 'incomeTax', title: 'Income Tax Portal' },
    { key: 'gst', title: 'GST Portal' },
    { key: 'tan', title: 'TAN Portal' },
    { key: 'traces', title: 'TRACES Portal' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {portals.map((p) => (
        <PortalCredential
          key={p.key}
          title={p.title}
          username={credentials[p.key]?.username}
          password={credentials[p.key]?.password}
          onUsernameChange={(v) => update(p.key, 'username', v)}
          onPasswordChange={(v) => update(p.key, 'password', v)}
        />
      ))}
    </div>
  );
}
