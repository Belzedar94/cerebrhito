'use client';

import React from 'react';
import { ActivityScheduler } from '@/components/activities/ActivityScheduler';
import { AIAssistant } from '@/components/ai-assistant/AIAssistant';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth/AuthContext';

export default function HomePage() {
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
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {user.fullName}!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Here's an overview of your child's development and upcoming
              activities.
            </p>
          </CardContent>
        </Card>

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
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activity Scheduler</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityScheduler childId={selectedChild} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>AI Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <AIAssistant childId={selectedChild} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
