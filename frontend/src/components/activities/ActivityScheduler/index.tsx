import React from 'react';

interface ActivitySchedulerProps extends React.HTMLAttributes<HTMLDivElement> {
  childId: string;
}

export default function ActivityScheduler({ childId }: ActivitySchedulerProps) {
  return (
    <div>
      <h2>Activity Scheduler</h2>
      {/* TODO: Implement activity scheduler */}
    </div>
  );
}
