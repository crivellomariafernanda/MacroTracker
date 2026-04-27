import type { CalculatedMacros } from '../types/nutrition'

type NutritionResultsProps = {
  macros: CalculatedMacros | null
  canAddToLog: boolean
  onAddToLog: () => void
}

export function NutritionResults({
  macros,
  canAddToLog,
  onAddToLog,
}: NutritionResultsProps) {
  return (
    <div className="card">
      <div className="card-header">📊 Nutricion Calculada</div>
      <div className="results-grid">
        <div className="result-box calories-box">
          <div className="result-value">
            {macros ? Math.round(macros.calories) : '—'}
          </div>
          <div className="result-label">Calorias</div>
        </div>
        <div className="result-box protein-box">
          <div className="result-value">{macros ? macros.protein.toFixed(1) : '—'}</div>
          <div className="result-label">Proteina</div>
        </div>
        <div className="result-box carbs-box">
          <div className="result-value">{macros ? macros.carbs.toFixed(1) : '—'}</div>
          <div className="result-label">Carbohidratos</div>
        </div>
        <div className="result-box fat-box">
          <div className="result-value">{macros ? macros.fat.toFixed(1) : '—'}</div>
          <div className="result-label">Grasas</div>
        </div>
      </div>
      <button
        className="btn btn-primary"
        type="button"
        disabled={!canAddToLog}
        onClick={onAddToLog}
      >
        ➕ Anadir al Registro
      </button>
    </div>
  )
}
