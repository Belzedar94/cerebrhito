'use client'

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { ActivityScheduler } from '@/components/activities/ActivityScheduler';
import { AIAssistant } from '@/components/ai-assistant/AIAssistant';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useRouter } from 'next/navigation';

export default function HomePage() {
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
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Welcome to CerebrHito</h1>
          
          {/* Child selector */}
          <div className="mb-8">
            <label htmlFor="child" className="block text-sm font-medium text-gray-700">
              Select a child
            </label>
            <select
              id="child"
              value={selectedChild || ''}
              onChange={(e) => setSelectedChild(e.target.value || null)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            >
              <option value="">Select a child</option>
              {/* TODO: Add children from user profile */}
              <option value="1">Juan (2 years)</option>
              <option value="2">María (1 year)</option>
            </select>
          </div>

          {selectedChild && (
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Activity Scheduler</h2>
                <ActivityScheduler childId={selectedChild} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-4">AI Assistant</h2>
                <AIAssistant childId={selectedChild} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
