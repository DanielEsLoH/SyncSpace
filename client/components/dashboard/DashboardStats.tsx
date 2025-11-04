'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface StatItem {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  description?: string;
}

interface DashboardStatsProps {
  stats: StatItem[];
  isLoading?: boolean;
}

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1000;
      const steps = 50;
      const increment = value / steps;
      const stepDuration = duration / steps;

      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return <span>{displayValue.toLocaleString()}</span>;
}

function TrendBadge({ trend }: { trend: StatItem['trend'] }) {
  if (!trend) return null;

  const Icon =
    trend.direction === 'up'
      ? TrendingUp
      : trend.direction === 'down'
      ? TrendingDown
      : Minus;

  const colorClass =
    trend.direction === 'up'
      ? 'text-green-600 dark:text-green-400'
      : trend.direction === 'down'
      ? 'text-red-600 dark:text-red-400'
      : 'text-muted-foreground';

  return (
    <div className={cn('flex items-center gap-1 text-xs font-medium', colorClass)}>
      <Icon className="h-3 w-3" />
      <span>{Math.abs(trend.value)}%</span>
    </div>
  );
}

function StatCard({ stat, delay }: { stat: StatItem; delay: number }) {
  const Icon = stat.icon;

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {stat.label}
          </CardTitle>
          <div
            className={cn(
              'rounded-full p-2 transition-transform duration-300 group-hover:scale-110',
              stat.bgColor
            )}
          >
            <Icon className={cn('h-4 w-4', stat.color)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-bold tracking-tight">
            <AnimatedNumber value={stat.value} delay={delay} />
          </p>
          {stat.trend && <TrendBadge trend={stat.trend} />}
        </div>
        {stat.description && (
          <p className="text-xs text-muted-foreground">{stat.description}</p>
        )}
      </CardContent>
      <div
        className={cn('absolute bottom-0 left-0 right-0 h-1', stat.color.replace('text-', 'bg-'))}
      />
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-8 w-8 rounded-full bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-9 w-20 rounded bg-muted" />
        <div className="h-3 w-32 rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={stat.label} stat={stat} delay={index * 100} />
      ))}
    </div>
  );
}
