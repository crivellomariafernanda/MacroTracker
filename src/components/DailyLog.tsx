import type { LogEntry } from '../types/nutrition'

type DailyLogProps = {
  entries: LogEntry[]
  onClear: () => void
}

type Totals = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

function getTotals(entries: LogEntry[]): Totals {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

export function DailyLog({ entries, onClear }: DailyLogProps) {
  const totals = getTotals(entries)

  return (
    <div className="card">
      <div className="card-header">
        <span>📝 Registro Diario</span>
        <button className="btn btn-sm btn-outline" type="button" onClick={onClear}>
          Limpiar
        </button>
      </div>

      <ul className="log-list">
        {entries.length === 0 ? (
          <li className="log-empty">Sin alimentos registrados.</li>
        ) : (
          entries.map((entry) => (
            <li key={entry.id} className="log-item">
              <span>{entry.foodName}</span>
              <span className="log-meta">
                {entry.weightGrams}g • {entry.calories}kcal • P:{entry.protein.toFixed(1)}g
              </span>
            </li>
          ))
        )}
      </ul>

      <div className="totals-bar">
        <div>{Math.round(totals.calories)} kcal</div>
        <div>{totals.protein.toFixed(1)}g P</div>
        <div>{totals.carbs.toFixed(1)}g C</div>
        <div>{totals.fat.toFixed(1)}g F</div>
      </div>
    </div>
  )
}
