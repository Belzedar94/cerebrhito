interface MilestoneCardProps {
  name: string;
  description: string;
  category: string;
  importance: number;
  achieved?: boolean;
  achievedAt?: string;
  notes?: string;
  onAchieve?: () => void;
}

export function MilestoneCard({
  name,
  description,
  category,
  importance,
  achieved,
  achievedAt,
  notes,
  onAchieve,
}: MilestoneCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <div className="mt-1 flex gap-2">
            <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800">
              {category}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
              Importancia: {importance}
            </span>
          </div>
        </div>
        {achieved && (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
            Logrado
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-600">{description}</p>

      {achievedAt && (
        <p className="mt-4 text-sm text-gray-600">
          Logrado el: {new Date(achievedAt).toLocaleDateString()}
        </p>
      )}

      {notes && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <p className="text-sm text-gray-600">{notes}</p>
        </div>
      )}

      {onAchieve && !achieved && (
        <button
          onClick={onAchieve}
          className="mt-4 rounded bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
        >
          Marcar como logrado
        </button>
      )}
    </div>
  );
}