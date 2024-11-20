'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { AIAssistant } from '@/components/ai-assistant/AIAssistant';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AIAssistantPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col">
      <main className="flex-1">
        <div className="mx-auto h-full max-w-4xl">
          <AIAssistant />
        </div>
      </main>
    </div>
  );
}