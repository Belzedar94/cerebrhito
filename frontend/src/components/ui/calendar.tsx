import React from 'react';

interface CalendarProps {
  className?: string;
  mode?: string;
  selected?: Date;
  onSelect?: (date: Date) => void;
}

export function Calendar({ className }: CalendarProps) {
  return <div className={className}>{/* TODO: Implement calendar */}</div>;
}
