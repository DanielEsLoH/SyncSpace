'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
  delay?: number;
}

export function StatCard({ icon: Icon, label, value, color, delay = 0 }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;

    const timeout = setTimeout(() => {
      const duration = 1000; // Animation duration in ms
      const steps = 50;
      const increment = value / steps;
      const stepDuration = duration / steps;

      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
          setHasAnimated(true);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay, hasAnimated]);

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-4xl font-bold tracking-tight">
              {displayValue.toLocaleString()}
            </p>
          </div>
          <div
            className={`rounded-full p-4 ${color} bg-opacity-10`}
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-8 w-8" style={{ color }} />
          </div>
        </div>

        {/* Decorative gradient bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />
      </CardContent>
    </Card>
  );
}
