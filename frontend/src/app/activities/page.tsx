'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { ActivityCalendar } from '@/components/activities/ActivityCalendar';
import { ActivityScheduler } from '@/components/activities/ActivityScheduler';
import { useRouter } from 'next/navigation';

export default function ActivitiesPage() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'scheduler'>('calendar');
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  if (!loading && !user) {
    router.push('/signin');
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Actividades de Desarrollo</h1>
          <p className="mt-2 text-gray-600">
            Planifica y realiza actividades para estimular el desarrollo de tu hijo
          </p>
        </div>

        {/* Child selector */}
        <div className="mb-8">
          <label htmlFor="child" className="block text-sm font-medium text-gray-700">
            Selecciona un hijo
          </label>
          <select
            id="child"
            value={selectedChild || ''}
            onChange={(e) => setSelectedChild(e.target.value || null)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            <option value="">Selecciona un hijo</option>
            {/* TODO: Add children from user profile */}
            <option value="1">Juan (2 años)</option>
            <option value="2">María (1 año)</option>
          </select>
        </div>

        {selectedChild && (
          <>
            {/* View selector */}
            <div className="mb-8">
              <div className="flex space-x-4">
                <button
                  onClick={() => setView('calendar')}
                  className={`rounded-lg px-4 py-2 ${
                    view === 'calendar'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Calendario
                </button>
                <button
                  onClick={() => setView('scheduler')}
                  className={`rounded-lg px-4 py-2 ${
                    view === 'scheduler'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Programar Actividades
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              {view === 'calendar' ? (
                <ActivityCalendar childId={selectedChild} />
              ) : (
                <ActivityScheduler
                  childId={selectedChild}
                  onSchedule={() => setView('calendar')}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}