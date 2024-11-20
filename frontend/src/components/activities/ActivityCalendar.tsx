import { useState, useEffect } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { ActivityCard } from './ActivityCard';

interface ActivityCalendarProps {
  childId: string;
}

export function ActivityCalendar({ childId }: ActivityCalendarProps) {
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [completedActivities, setCompletedActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    getUpcomingActivities,
    getCompletedActivities,
    updateActivityLog,
  } = useActivities();

  // Load activities
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setError(null);
        setLoading(true);

        const [upcoming, completed] = await Promise.all([
          getUpcomingActivities(childId),
          getCompletedActivities(childId),
        ]);

        setUpcomingActivities(upcoming);
        setCompletedActivities(completed);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [childId, getUpcomingActivities, getCompletedActivities]);

  const handleComplete = async (logId: string) => {
    try {
      setError(null);
      const updatedLog = await updateActivityLog(logId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      // Update lists
      setUpcomingActivities(prev => prev.filter(log => log.id !== logId));
      setCompletedActivities(prev => [...prev, updatedLog]);
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
      {/* Upcoming activities */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Actividades Programadas</h2>
        {upcomingActivities.length === 0 ? (
          <p className="text-gray-500">No hay actividades programadas</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingActivities.map((log) => (
              <ActivityCard
                key={log.id}
                name={log.activity.name}
                description={log.activity.description}
                duration={log.activity.durationMinutes}
                category={log.activity.category}
                tags={log.activity.tags}
                aiGenerated={log.activity.aiGenerated}
                status="pending"
                scheduledFor={log.scheduledFor}
                onComplete={() => handleComplete(log.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Completed activities */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Actividades Completadas</h2>
        {completedActivities.length === 0 ? (
          <p className="text-gray-500">No hay actividades completadas</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedActivities.map((log) => (
              <ActivityCard
                key={log.id}
                name={log.activity.name}
                description={log.activity.description}
                duration={log.activity.durationMinutes}
                category={log.activity.category}
                tags={log.activity.tags}
                aiGenerated={log.activity.aiGenerated}
                status="completed"
                scheduledFor={log.scheduledFor}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}