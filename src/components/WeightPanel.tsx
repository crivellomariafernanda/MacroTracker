import type { FoodItem, Unit } from '../types/nutrition'

type WeightPanelProps = {
  selectedFood: FoodItem | null
  weightValue: number
  unit: Unit
  eggCount: number
  onWeightChange: (value: number) => void
  onUnitChange: (value: Unit) => void
  onEggCountChange: (value: number) => void
  onQuickWeight: (value: number) => void
}

const presets = [100, 150, 200, 250, 28, 85]

export function WeightPanel({
  selectedFood,
  weightValue,
  unit,
  eggCount,
  onWeightChange,
  onUnitChange,
  onEggCountChange,
  onQuickWeight,
}: WeightPanelProps) {
  const isEgg = Boolean(selectedFood?.isEgg)

  return (
    <div className="card">
      <div className="card-header">⚖️ Peso</div>

      {!isEgg ? (
        <div className="weight-section">
          <div className="weight-input-group">
            <input
              id="weightInput"
              type="number"
              min={0}
              value={weightValue}
              onChange={(event) => onWeightChange(Number(event.target.value))}
            />
            <select
              id="unitSelect"
              value={unit}
              onChange={(event) => onUnitChange(event.target.value as Unit)}
            >
              <option value="g">gramos</option>
              <option value="oz">oz</option>
              <option value="lb">lb</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="egg-option visible">
          <span>🥚 N°:</span>
          <input
            id="eggCountInput"
            type="number"
            min={0.5}
            step={0.5}
            value={eggCount}
            onChange={(event) => onEggCountChange(Number(event.target.value))}
          />
          <span className="raw-values-hint">(50g entero, 33g clara)</span>
        </div>
      )}

      <div className="quick-weight-btns">
        {presets.map((preset) => (
          <button
            key={preset}
            className={`quick-weight-btn ${weightValue === preset ? 'active-preset' : ''}`}
            type="button"
            onClick={() => onQuickWeight(preset)}
          >
            {preset === 28 ? '1 oz' : preset === 85 ? '3 oz' : `${preset}g`}
          </button>
        ))}
      </div>
    </div>
  )
}
