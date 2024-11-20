import { useState, useEffect } from 'react';
import { useDevelopment } from '@/hooks/useDevelopment';
import { MilestoneCard } from './MilestoneCard';

interface MilestoneTrackerProps {
  childId: string;
}

export function MilestoneTracker({ childId }: MilestoneTrackerProps) {
  const [achievedMilestones, setAchievedMilestones] = useState<any[]>([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    getAchievedMilestones,
    getUpcomingMilestones,
    trackMilestone,
  } = useDevelopment();

  // Load milestones
  useEffect(() => {
    const loadMilestones = async () => {
      try {
        setError(null);
        setLoading(true);

        const [achieved, upcoming] = await Promise.all([
          getAchievedMilestones(childId),
          getUpcomingMilestones(childId),
        ]);

        setAchievedMilestones(achieved);
        setUpcomingMilestones(upcoming);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadMilestones();
  }, [childId, getAchievedMilestones, getUpcomingMilestones]);

  const handleAchieve = async (milestoneId: string) => {
    try {
      setError(null);
      const tracking = await trackMilestone(
        childId,
        milestoneId,
        new Date().toISOString()
      );

      // Update lists
      const milestone = upcomingMilestones.find(m => m.id === milestoneId);
      if (milestone) {
        setUpcomingMilestones(prev => prev.filter(m => m.id !== milestoneId));
        setAchievedMilestones(prev => [...prev, tracking]);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming milestones */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Próximos Hitos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingMilestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              name={milestone.name}
              description={milestone.description}
              category={milestone.category}
              importance={milestone.importance}
              onAchieve={() => handleAchieve(milestone.id)}
            />
          ))}
        </div>
      </section>

      {/* Achieved milestones */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Hitos Logrados</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievedMilestones.map((tracking) => (
            <MilestoneCard
              key={tracking.id}
              name={tracking.milestone.name}
              description={tracking.milestone.description}
              category={tracking.milestone.category}
              importance={tracking.milestone.importance}
              achieved
              achievedAt={tracking.achieved_at}
              notes={tracking.notes}
            />
          ))}
        </div>
      </section>
    </div>
  );
}