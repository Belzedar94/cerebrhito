import { Loading } from '@/components/ui/Loading';
import { useEffect } from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  title?: string;
  fullWidth?: boolean;
}

export function PageContainer({
  children,
  loading = false,
  error = null,
  onRetry,
  title,
  fullWidth = false,
}: PageContainerProps) {
  // Scroll to top when error state changes
  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  return (
    <main className={`min-h-screen ${fullWidth ? 'w-full' : 'container mx-auto'} px-4 py-8`}>
      {title && (
        <h1 className="text-3xl font-bold mb-8">{title}</h1>
      )}

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3 text-red-700 mb-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      ) : loading ? (
        <Loading size="large" text="Loading..." />
      ) : (
        children
      )}
    </main>
  );
}