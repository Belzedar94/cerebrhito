export interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  ageRange: string;
  duration: number;
  materials: string[];
  steps: string[];
  tips: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  activityId: string;
  childId: string;
  startTime: string;
  endTime: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleActivityData {
  activityId: string;
  childId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface UpdateActivityLogData {
  notes?: string;
  status?: 'completed' | 'cancelled';
  endTime?: string;
}
