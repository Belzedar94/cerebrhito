import { useState, useCallback } from 'react';

interface Milestone {
  id: string;
  name: string;
  description: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  category: string;
  importance: number;
}

interface MilestoneTracking {
  id: string;
  childId: string;
  milestoneId: string;
  achievedAt?: string;
  notes?: string;
  milestone: Milestone;
}

interface DevelopmentStats {
  overall: {
    achieved: number;
    total: number;
    percentage: number;
  };
  categories: {
    category: string;
    achieved: number;
    total: number;
    percentage: number;
  }[];
}

export function useDevelopment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMilestonesForChild = useCallback(async (
    childId: string,
    category?: string
  ): Promise<Milestone[]> => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const queryParams = new URLSearchParams();
      if (category) queryParams.append('category', category);

      const response = await fetch(
        `/api/development/child/${childId}/milestones?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get milestones');
      }

      return response.json();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const trackMilestone = useCallback(async (
    childId: string,
    milestoneId: string,
    achievedAt?: string,
    notes?: string
  ): Promise<MilestoneTracking> => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/development/milestones/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          childId,
          milestoneId,
          achievedAt,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track milestone');
      }

      return response.json();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAchievedMilestones = useCallback(async (childId: string): Promise<MilestoneTracking[]> => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/development/child/${childId}/milestones/achieved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get achieved milestones');
      }

      return response.json();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUpcomingMilestones = useCallback(async (childId: string): Promise<Milestone[]> => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/development/child/${childId}/milestones/upcoming`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get upcoming milestones');
      }

      return response.json();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReport = useCallback(async (childId: string): Promise<string> => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/development/child/${childId}/report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      return data.report;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDevelopmentStats = useCallback(async (childId: string): Promise<DevelopmentStats> => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/development/child/${childId}/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get development stats');
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
    getMilestonesForChild,
    trackMilestone,
    getAchievedMilestones,
    getUpcomingMilestones,
    generateReport,
    getDevelopmentStats,
  };
}