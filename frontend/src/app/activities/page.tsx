'use client';

import { useState } from 'react';
import { ActivityCalendar } from '@/components/activities/ActivityCalendar';
import { ActivityScheduler } from '@/components/activities/ActivityScheduler';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ActivitiesPage() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in to access this page.</div>;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select a child</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              onValueChange={value => setSelectedChild(value)}
              value={selectedChild || undefined}
            >
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
    </MainLayout>
  );
}
