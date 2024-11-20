interface ActivityCardProps {
  name: string;
  description: string;
  duration: number;
  category: string;
  tags: string[];
  aiGenerated?: boolean;
  onSchedule?: () => void;
  onComplete?: () => void;
  status?: 'pending' | 'completed' | 'skipped';
  scheduledFor?: string;
}

export function ActivityCard({
  name,
  description,
  duration,
  category,
  tags,
  aiGenerated,
  onSchedule,
  onComplete,
  status,
  scheduledFor,
}: ActivityCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          {aiGenerated && (
            <span className="mb-2 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
              AI Sugerido
            </span>
          )}
        </div>
        {status && (
          <span
            className={`rounded-full px-2 py-1 text-xs ${
              status === 'completed'
                ? 'bg-green-100 text-green-800'
                : status === 'skipped'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {status === 'completed'
              ? 'Completado'
              : status === 'skipped'
              ? 'Omitido'
              : 'Pendiente'}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-600">{description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
          {duration} minutos
        </span>
        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800">
          {category}
        </span>
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
          >
            {tag}
          </span>
        ))}
      </div>

      {scheduledFor && (
        <p className="mt-4 text-sm text-gray-600">
          Programado para: {new Date(scheduledFor).toLocaleString()}
        </p>
      )}

      {(onSchedule || onComplete) && (
        <div className="mt-4 flex gap-2">
          {onSchedule && (
            <button
              onClick={onSchedule}
              className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
            >
              Programar
            </button>
          )}
          {onComplete && (
            <button
              onClick={onComplete}
              className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
            >
              Completar
            </button>
          )}
        </div>
      )}
    </div>
  );
}