import React from 'react';
import type { Activity } from '@/types/activity';

interface ActivityCardProps {
  activity: Activity;
  status?: string;
  scheduledFor?: string;
  onComplete?: () => Promise<void>;
}

export default function ActivityCard({
  activity,
  status,
  scheduledFor,
  onComplete,
}: ActivityCardProps) {
  return (
    <div>
      <h3>{activity.title}</h3>
      {/* TODO: Implement activity card */}
    </div>
  );
}
