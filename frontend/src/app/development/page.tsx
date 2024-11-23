'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DevelopmentReport } from '@/components/development/DevelopmentReport';
import { DevelopmentStats } from '@/components/development/DevelopmentStats';
import { MilestoneTracker } from '@/components/development/MilestoneTracker';
import { useDevelopment } from '@/hooks/useDevelopment';
import { useAuth } from '@/lib/auth/AuthContext';

export default function DevelopmentPage() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [view, setView] = useState<'milestones' | 'stats' | 'report'>(
    'milestones'
  );
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const { getDevelopmentStats } = useDevelopment();
  const router = useRouter();

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push('/signin');

    return null;
  }

  // Load development stats when child is selected
  useEffect(() => {
    const loadStats = async () => {
      if (!selectedChild) {
        return;
      }

      try {
        setError(null);
        setLoading(true);
        const data = await getDevelopmentStats(selectedChild);

        setStats(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedChild, getDevelopmentStats]);

  if (authLoading) {
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
          <h1 className="text-3xl font-bold">Seguimiento del Desarrollo</h1>
          <p className="mt-2 text-gray-600">
            Monitorea el progreso y los hitos del desarrollo de tu hijo
          </p>
        </div>

        {/* Child selector */}
        <div className="mb-8">
          <label
            htmlFor="child"
            className="block text-sm font-medium text-gray-700"
          >
            Selecciona un hijo
          </label>
          <select
            id="child"
            value={selectedChild || ''}
            onChange={e => setSelectedChild(e.target.value || null)}
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
                  onClick={() => setView('milestones')}
                  className={`rounded-lg px-4 py-2 ${
                    view === 'milestones'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Hitos
                </button>
                <button
                  onClick={() => setView('stats')}
                  className={`rounded-lg px-4 py-2 ${
                    view === 'stats'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Estadísticas
                </button>
                <button
                  onClick={() => setView('report')}
                  className={`rounded-lg px-4 py-2 ${
                    view === 'report'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Reporte
                </button>
              </div>
            </div>

            {/* Content */}
            <div>
              {view === 'milestones' && (
                <MilestoneTracker childId={selectedChild} />
              )}
              {view === 'stats' && stats && (
                <DevelopmentStats
                  overall={stats.overall}
                  categories={stats.categories}
                />
              )}
              {view === 'report' && (
                <DevelopmentReport childId={selectedChild} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
