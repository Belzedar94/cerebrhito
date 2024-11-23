'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { ActivityCalendar } from '@/components/activities/ActivityCalendar';
import { ActivityScheduler } from '@/components/activities/ActivityScheduler';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ActivitiesPage() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    router.push('/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Development Activities</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select a child</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={(value) => setSelectedChild(value)} value={selectedChild || undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a child" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Juan (2 years)</SelectItem>
                <SelectItem value="2">María (1 year)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedChild && (
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="scheduler">Schedule Activities</TabsTrigger>
            </TabsList>
            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityCalendar childId={selectedChild} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="scheduler">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Scheduler</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityScheduler childId={selectedChild} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

