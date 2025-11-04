'use client';

import { FileText, Heart, MessageCircle } from 'lucide-react';
import { StatCard } from './StatCard';
import { StatsSkeleton } from './StatsSkeleton';
import { UserStats } from '@/types';

interface ProfileStatsProps {
  stats: UserStats;
  isLoading?: boolean;
}

export function ProfileStats({ stats, isLoading }: ProfileStatsProps) {
  if (isLoading) {
    return <StatsSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        icon={FileText}
        label="Total Posts"
        value={stats.total_posts}
        color="#3b82f6"
        delay={0}
      />
      <StatCard
        icon={Heart}
        label="Total Reactions"
        value={stats.total_reactions}
        color="#ef4444"
        delay={100}
      />
      <StatCard
        icon={MessageCircle}
        label="Total Comments"
        value={stats.total_comments}
        color="#10b981"
        delay={200}
      />
    </div>
  );
}
