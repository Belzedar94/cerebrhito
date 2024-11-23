import { useState, useEffect } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { ActivityCard } from './ActivityCard';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityCalendarProps {
  childId: string;
}

export function ActivityCalendar({ childId }: ActivityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [completedActivities, setCompletedActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    getUpcomingActivities,
    getCompletedActivities,
    updateActivityLog,
  } = useActivities();

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setError(null);
        setLoading(true);

        const [upcoming, completed] = await Promise.all([
          getUpcomingActivities(childId, selectedDate),
          getCompletedActivities(childId, selectedDate),
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
  }, [childId, selectedDate, getUpcomingActivities, getCompletedActivities]);

  const handleComplete = async (logId: string) => {
    try {
      setError(null);
      const updatedLog = await updateActivityLog(logId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Activities for {selectedDate?.toLocaleDateString()}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-8">
              <section>
                <h3 className="font-semibold mb-4">Scheduled Activities</h3>
                {upcomingActivities.length === 0 ? (
                  <p className="text-gray-500">No scheduled activities</p>
                ) : (
                  <div className="space-y-4">
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
              <section>
                <h3 className="font-semibold mb-4">Completed Activities</h3>
                {completedActivities.length === 0 ? (
                  <p className="text-gray-500">No completed activities</p>
                ) : (
                  <div className="space-y-4">
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
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

