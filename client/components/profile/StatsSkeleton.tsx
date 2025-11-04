import { Card, CardContent } from '@/components/ui/card';

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-10 bg-muted rounded w-20" />
              </div>
              <div className="rounded-full h-16 w-16 bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
