import type { FoodItem } from '../types/nutrition'

type FoodSelectorProps = {
  query: string
  selectedFood: FoodItem | null
  filteredFoods: FoodItem[]
  showDropdown: boolean
  onQueryChange: (value: string) => void
  onSelectFood: (food: FoodItem) => void
  onClear: () => void
  onOpenDropdown: () => void
}

export function FoodSelector({
  query,
  selectedFood,
  filteredFoods,
  showDropdown,
  onQueryChange,
  onSelectFood,
  onClear,
  onOpenDropdown,
}: FoodSelectorProps) {
  return (
    <div className="card">
      <div className="card-header">🔍 Seleccionar Alimento</div>
      <div className="food-selector">
        <div className="search-wrapper">
          <span className="search-icon">🔎</span>
          <input
            id="foodSearch"
            type="text"
            placeholder="Buscar alimento..."
            autoComplete="off"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={onOpenDropdown}
          />
          <button
            className={`clear-search-btn ${query ? 'visible' : ''}`}
            type="button"
            onClick={onClear}
          >
            ✕
          </button>
        </div>

        {showDropdown && filteredFoods.length > 0 ? (
          <div className="dropdown active">
            {filteredFoods.map((food) => (
              <button
                key={food.id}
                type="button"
                className="dropdown-item"
                onClick={() => onSelectFood(food)}
              >
                <span>{food.name.es}</span>
                <span className="item-meta">
                  {food.cal}kcal P:{food.p}g
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {selectedFood ? (
        <div className="selected-food-display">
          <span className="food-chip">{selectedFood.name.es}</span>
          <span className="raw-values-hint">
            (por 100g: {selectedFood.cal}kcal, P:{selectedFood.p}g)
          </span>
        </div>
      ) : null}
    </div>
  )
}
