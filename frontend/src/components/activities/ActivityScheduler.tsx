import { useState, useEffect } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { ActivityCard } from './ActivityCard';

interface ActivitySchedulerProps {
  childId: string;
  onSchedule?: () => void;
}

export function ActivityScheduler({ childId, onSchedule }: ActivitySchedulerProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    getActivitiesForChild,
    generateSuggestions,
    scheduleActivity,
  } = useActivities();

  // Load activities and suggestions
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        setLoading(true);

        const [activityList, suggestionList] = await Promise.all([
          getActivitiesForChild(childId),
          generateSuggestions(childId),
        ]);

        setActivities(activityList);
        setSuggestions(suggestionList);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [childId, getActivitiesForChild, generateSuggestions]);

  const handleSchedule = async (activityId: string) => {
    if (!selectedDate) {
      setError('Por favor selecciona una fecha');
      return;
    }

    try {
      setError(null);
      await scheduleActivity({
        childId,
        activityId,
        scheduledFor: new Date(selectedDate).toISOString(),
      });

      onSchedule?.();
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
      {/* Date selector */}
      <div className="mb-6">
        <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">
          Fecha y hora
        </label>
        <input
          type="datetime-local"
          id="scheduledDate"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
        />
      </div>

      {/* AI suggestions */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Sugerencias del AI</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((activity) => (
            <ActivityCard
              key={activity.id}
              name={activity.name}
              description={activity.description}
              duration={activity.durationMinutes}
              category={activity.category}
              tags={activity.tags}
              aiGenerated
              onSchedule={() => handleSchedule(activity.id)}
            />
          ))}
        </div>
      </section>

      {/* Available activities */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Todas las Actividades</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              name={activity.name}
              description={activity.description}
              duration={activity.durationMinutes}
              category={activity.category}
              tags={activity.tags}
              onSchedule={() => handleSchedule(activity.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}