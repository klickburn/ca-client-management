import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SERVICES = ['Income Tax Filing', 'GST Filing', 'Accounting', 'Audit', 'Company Formation', 'Consultancy', 'Other'];

export default function ServicesNotesForm({ services = [], notes = '', onServicesChange, onNotesChange }) {
  const toggleService = (service) => {
    if (services.includes(service)) {
      onServicesChange(services.filter((s) => s !== service));
    } else {
      onServicesChange([...services, service]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Services</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SERVICES.map((service) => (
            <label
              key={service}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors ${
                services.includes(service)
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-muted text-muted-foreground hover:bg-secondary'
              }`}
            >
              <input
                type="checkbox"
                checked={services.includes(service)}
                onChange={() => toggleService(service)}
                className="sr-only"
              />
              {service}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Internal notes about this client..."
        />
      </div>
    </div>
  );
}
