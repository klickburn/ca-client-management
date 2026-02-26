import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <Card className="border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings size={16} />
            Firm Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Firm settings and configuration options will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
