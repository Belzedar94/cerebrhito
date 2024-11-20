import { useState, useCallback } from 'react';

interface Activity {
  id: string;
  name: string;
  description: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  durationMinutes: number;
  category: string;
  tags: string[];
  aiGenerated: boolean;
}

interface ActivityLog {
  id: string;
  childId: string;
  activityId: string;
  status: 'pending' | 'completed' | 'skipped';
  scheduledFor: string;
  completedAt?: string;
  notes?: string;
  durationMinutes?: number;
  activity: Activity;
}

interface ScheduleActivityData {
  childId: string;
  activityId: string;
  scheduledFor: string;
  notes?: string;
}

interface UpdateActivityLogData {
  status: 'pending' | 'completed' | 'skipped';
  completedAt?: string;
  notes?: string;
  durationMinutes?: number;
}

export function useActivities() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getActivitiesForChild = useCallback(async (
    childId: string,
    category?: string,
    tags?: string[]
  ): Promise<Activity[]> => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const queryParams = new URLSearchParams();
      if (category) queryParams.append('category', category);
      if (tags) tags.forEach(tag => queryParams.append('tags', tag));

      const response = await fetch(
        `/api/activities/child/${childId}?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get activities');
      }

      return response.json();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleActivity = useCallback(async (data: ScheduleActivityData): Promise<ActivityLog> => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/activities/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule activity');
      }

      return response.json();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateActivityLog = useCallback(async (
    logId: string,
    data: UpdateActivityLogData
  ): Promise<ActivityLog> => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/activities/log/${logId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update activity log');
      }

      return response.json();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUpcomingActivities = useCallback(async (childId: string): Promise<ActivityLog[]> => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/activities/child/${childId}/upcoming`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get upcoming activities');
      }

      return response.json();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCompletedActivities = useCallback(async (childId: string): Promise<ActivityLog[]> => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/activities/child/${childId}/completed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get completed activities');
      }

      return response.json();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateSuggestions = useCallback(async (childId: string): Promise<Activity[]> => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/activities/child/${childId}/suggestions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      return response.json();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getActivitiesForChild,
    scheduleActivity,
    updateActivityLog,
    getUpcomingActivities,
    getCompletedActivities,
    generateSuggestions,
  };
}