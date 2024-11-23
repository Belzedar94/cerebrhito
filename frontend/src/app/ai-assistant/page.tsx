'use client';

import { AIAssistant } from '@/components/ai-assistant/AIAssistant';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/AuthContext';

export default function AIAssistantPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in to access this page.</div>;
  }

  return (
    <MainLayout>
      <Card className="h-[calc(100vh-8rem)]">
        <CardHeader>
          <CardTitle>AI Assistant</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-5rem)]">
          <AIAssistant />
        </CardContent>
      </Card>
    </MainLayout>
  );
}
