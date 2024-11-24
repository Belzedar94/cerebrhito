import React from 'react';

interface CalendarProps {
  mode?: string;
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
}

export function Calendar({
  className,
  mode,
  selected,
  onSelect,
}: CalendarProps) {
  return <div className={className}>{/* TODO: Implement calendar */}</div>;
}
