import { useEffect, useMemo, useState } from 'react'
import { DailyLog } from './components/DailyLog'
import { FoodSelector } from './components/FoodSelector'
import { NutritionResults } from './components/NutritionResults'
import { WeightPanel } from './components/WeightPanel'
import { foods } from './data/foods'
import type { CalculatedMacros, FoodItem, LogEntry, Unit } from './types/nutrition'
import './styles/app.css'

function App() {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [weightValue, setWeightValue] = useState(100)
  const [unit, setUnit] = useState<Unit>('g')
  const [eggCount, setEggCount] = useState(1)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])

  useEffect(() => {
    const raw = localStorage.getItem('macroDailyLog')
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as LogEntry[]
      setLogEntries(parsed)
    } catch {
      setLogEntries([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('macroDailyLog', JSON.stringify(logEntries))
  }, [logEntries])

  const filteredFoods = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return foods
    return foods.filter((food) => food.name.es.toLowerCase().includes(term))
  }, [query])

  function toGrams(value: number, selectedUnit: Unit): number {
    if (selectedUnit === 'oz') return value * 28.3495
    if (selectedUnit === 'lb') return value * 453.592
    return value
  }

  const currentGrams = useMemo(() => {
    if (!selectedFood) return null
    if (selectedFood.isEgg) {
      if (!selectedFood.eggWeight || eggCount <= 0) return null
      return selectedFood.eggWeight * eggCount
    }
    if (weightValue <= 0) return null
    return toGrams(weightValue, unit)
  }, [selectedFood, eggCount, weightValue, unit])

  const computedMacros = useMemo<CalculatedMacros | null>(() => {
    if (!selectedFood || !currentGrams) return null
    const factor = currentGrams / 100
    return {
      calories: selectedFood.cal * factor,
      protein: selectedFood.p * factor,
      carbs: selectedFood.c * factor,
      fat: selectedFood.f * factor,
    }
  }, [selectedFood, currentGrams])

  function handleSelectFood(food: FoodItem) {
    setSelectedFood(food)
    setQuery(food.name.es)
    setShowDropdown(false)
  }

  function addToLog() {
    if (!selectedFood || !computedMacros || !currentGrams) return

    setLogEntries((prev) => [
      ...prev,
      {
        id: Date.now(),
        foodId: selectedFood.id,
        foodName: selectedFood.name.es,
        weightGrams: Math.round(currentGrams * 10) / 10,
        calories: Math.round(computedMacros.calories),
        protein: Math.round(computedMacros.protein * 10) / 10,
        carbs: Math.round(computedMacros.carbs * 10) / 10,
        fat: Math.round(computedMacros.fat * 10) / 10,
      },
    ])
  }

  const topProteinFoods = useMemo(
    () => [...foods].sort((a, b) => b.p - a.p).slice(0, 7),
    [],
  )

  return (
    <div className="app-layout">
      <aside className="sidebar-left">
        <div className="card">
          <div className="card-header">📘 Manual Proteico</div>
          <input type="text" placeholder="Agregar ingrediente" disabled />
          <button className="btn btn-sm" type="button" disabled>
            ➕ Agregar
          </button>
          <div className="recipe-box">Seccion de recetas (placeholder)</div>
        </div>
      </aside>

      <main className="main-content">
        <div className="header">
          <h1>🥗 Macro Tracker</h1>
          <div className="lang-switch">
            <button className="lang-btn active" type="button">
              🇪🇸 ES
            </button>
            <button className="lang-btn" type="button" disabled>
              🇬🇧 EN
            </button>
          </div>
        </div>

        <FoodSelector
          query={query}
          selectedFood={selectedFood}
          filteredFoods={filteredFoods}
          showDropdown={showDropdown}
          onQueryChange={(value) => {
            setQuery(value)
            setShowDropdown(true)
          }}
          onSelectFood={handleSelectFood}
          onClear={() => {
            setQuery('')
            setSelectedFood(null)
            setShowDropdown(false)
          }}
          onOpenDropdown={() => setShowDropdown(true)}
        />

        <WeightPanel
          selectedFood={selectedFood}
          weightValue={weightValue}
          unit={unit}
          eggCount={eggCount}
          onWeightChange={(value) => setWeightValue(value)}
          onUnitChange={(value) => setUnit(value)}
          onEggCountChange={(value) => setEggCount(value)}
          onQuickWeight={(value) => {
            setWeightValue(value)
            setUnit('g')
          }}
        />

        <NutritionResults
          macros={computedMacros}
          canAddToLog={Boolean(selectedFood && computedMacros)}
          onAddToLog={addToLog}
        />

        <div className="card">
          <div className="card-header">🎯 Metas Diarias</div>
          <div className="goal-display">
            <div className="goal-item">
              <label>Calorias</label>
              <input type="number" value={2000} readOnly />
            </div>
            <div className="goal-item">
              <label>Proteina (g)</label>
              <input type="number" value={150} readOnly />
            </div>
            <div className="goal-item">
              <label>Carbos (g)</label>
              <input type="number" value={200} readOnly />
            </div>
            <div className="goal-item">
              <label>Grasas (g)</label>
              <input type="number" value={55} readOnly />
            </div>
          </div>
        </div>

        <DailyLog entries={logEntries} onClear={() => setLogEntries([])} />
      </main>

      <aside className="sidebar-right">
        <div className="card">
          <div className="card-header">🏆 Top Proteina</div>
          <ul className="sidebar-list">
            {topProteinFoods.map((food) => (
              <li key={food.id}>
                <span>{food.name.es}</span>
                <strong>{food.p}g</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="card-header">🎯 Completar Meta</div>
          <p>Seccion de sugerencias (placeholder)</p>
        </div>
      </aside>
    </div>
  )
}

export default App
