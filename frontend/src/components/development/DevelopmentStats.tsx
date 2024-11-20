interface DevelopmentStatsProps {
  overall: {
    achieved: number;
    total: number;
    percentage: number;
  };
  categories: {
    category: string;
    achieved: number;
    total: number;
    percentage: number;
  }[];
}

export function DevelopmentStats({ overall, categories }: DevelopmentStatsProps) {
  return (
    <div className="space-y-6">
      {/* Overall progress */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold">Progreso General</h3>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span>{overall.achieved} de {overall.total} hitos logrados</span>
            <span className="font-medium">{overall.percentage}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${overall.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category progress */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold">Progreso por Categoría</h3>
        <div className="mt-4 space-y-4">
          {categories.map((category) => (
            <div key={category.category}>
              <div className="flex items-center justify-between text-sm">
                <span>{category.category}</span>
                <span className="font-medium">{category.percentage}%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {category.achieved} de {category.total} hitos logrados
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}