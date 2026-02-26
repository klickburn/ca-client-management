import { Card, CardContent } from '@/components/ui/card';

export default function StatCard({ title, value, icon: Icon }) {
  return (
    <Card className="border-0 bg-card">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
          </div>
          {Icon && (
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon size={20} className="text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
