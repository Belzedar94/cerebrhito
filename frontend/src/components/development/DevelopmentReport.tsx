import { useState, useEffect } from 'react';
import { useDevelopment } from '@/hooks/useDevelopment';

interface DevelopmentReportProps {
  childId: string;
}

export function DevelopmentReport({ childId }: DevelopmentReportProps) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { generateReport } = useDevelopment();

  useEffect(() => {
    const loadReport = async () => {
      try {
        setError(null);
        setLoading(true);
        const reportText = await generateReport(childId);
        setReport(reportText);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [childId, generateReport]);

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

  if (!report) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4 text-yellow-700">
        No hay reporte disponible
      </div>
    );
  }

  // Split report into sections
  const sections = report.split('\n\n').map((section, index) => {
    const [title, ...content] = section.split('\n');
    return (
      <div key={index} className="mb-6">
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        {content.map((line, i) => (
          <p key={i} className="mb-1 text-gray-600">
            {line}
          </p>
        ))}
      </div>
    );
  });

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Reporte de Desarrollo</h2>
      {sections}
    </div>
  );
}