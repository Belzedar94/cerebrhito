import React from 'react';
import type { Activity } from '@/types/activity';

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <div>
      <h3>{activity.title}</h3>
      {/* TODO: Implement activity card */}
    </div>
  );
}
