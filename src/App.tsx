import type { Session } from '@supabase/supabase-js'
import { useEffect, useMemo, useState } from 'react'
import { DailyLog } from './components/DailyLog'
import { FoodSelector } from './components/FoodSelector'
import { NutritionResults } from './components/NutritionResults'
import { WeightPanel } from './components/WeightPanel'
import { foods } from './data/foods'
import { supabase } from './lib/supabase'
import type { CalculatedMacros, FoodItem, LogEntry, Unit } from './types/nutrition'
import './styles/app.css'

type DailyLogRow = {
  id: string
  user_id: string
  logged_on: string
  food_id: string
  food_name: string
  weight_grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

function toTodayDateString() {
  return new Date().toISOString().slice(0, 10)
}

function mapRowToEntry(row: DailyLogRow): LogEntry {
  return {
    id: row.id,
    foodId: row.food_id,
    foodName: row.food_name,
    weightGrams: Number(row.weight_grams),
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
  }
}

function App() {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [weightValue, setWeightValue] = useState(100)
  const [unit, setUnit] = useState<Unit>('g')
  const [eggCount, setEggCount] = useState(1)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [authError, setAuthError] = useState('')

  async function loadTodayEntries(userId: string) {
    const today = toTodayDateString()
    const { data, error } = await supabase
      .from('daily_log_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('logged_on', today)
      .order('created_at', { ascending: true })

    if (error) {
      setAuthError(error.message)
      return
    }

    const rows = (data ?? []) as DailyLogRow[]
    setLogEntries(rows.map(mapRowToEntry))
  }

  useEffect(() => {
    let mounted = true

    async function bootstrapSession() {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return

      if (error) {
        setAuthError(error.message)
        setAuthLoading(false)
        return
      }

      setSession(data.session)
      if (data.session?.user?.id) {
        await loadTodayEntries(data.session.user.id)
      } else {
        setLogEntries([])
      }
      setAuthLoading(false)
    }

    bootstrapSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setLogEntries([])
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const filteredFoods = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return foods
    return foods.filter((food) => food.name.es.toLowerCase().includes(term))
  }, [query])

  const exactMatchedFood = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return null

    return (
      foods.find(
        (food) =>
          food.name.es.toLowerCase() === term || food.name.en.toLowerCase() === term,
      ) ?? null
    )
  }, [query])

  const activeFood = selectedFood ?? exactMatchedFood

  function toGrams(value: number, selectedUnit: Unit): number {
    if (selectedUnit === 'oz') return value * 28.3495
    if (selectedUnit === 'lb') return value * 453.592
    return value
  }

  const currentGrams = useMemo(() => {
    if (!activeFood) return null
    if (activeFood.isEgg) {
      if (!activeFood.eggWeight || eggCount <= 0) return null
      return activeFood.eggWeight * eggCount
    }
    if (weightValue <= 0) return null
    return toGrams(weightValue, unit)
  }, [activeFood, eggCount, weightValue, unit])

  const computedMacros = useMemo<CalculatedMacros | null>(() => {
    if (!activeFood || !currentGrams) return null
    const factor = currentGrams / 100
    return {
      calories: activeFood.cal * factor,
      protein: activeFood.p * factor,
      carbs: activeFood.c * factor,
      fat: activeFood.f * factor,
    }
  }, [activeFood, currentGrams])

  function handleSelectFood(food: FoodItem) {
    setSelectedFood(food)
    setQuery(food.name.es)
    setShowDropdown(false)
  }

  async function addToLog() {
    if (!session?.user?.id) {
      setAuthError('Inicia sesion para guardar tu registro diario.')
      return
    }

    const foodToLog = selectedFood ?? exactMatchedFood
    if (!foodToLog || !computedMacros || !currentGrams) return
    setSelectedFood(foodToLog)
    setQuery(foodToLog.name.es)
    setShowDropdown(false)

    setSaving(true)
    setAuthError('')

    const insertPayload = {
      user_id: session.user.id,
      logged_on: toTodayDateString(),
      food_id: foodToLog.id,
      food_name: foodToLog.name.es,
      weight_grams: Math.round(currentGrams * 10) / 10,
      calories: Math.round(computedMacros.calories),
      protein: Math.round(computedMacros.protein * 10) / 10,
      carbs: Math.round(computedMacros.carbs * 10) / 10,
      fat: Math.round(computedMacros.fat * 10) / 10,
    }

    const { data, error } = await supabase
      .from('daily_log_entries')
      .insert(insertPayload)
      .select('*')
      .single()

    setSaving(false)

    if (error) {
      setAuthError(error.message)
      return
    }

    setLogEntries((prev) => [...prev, mapRowToEntry(data as DailyLogRow)])

    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 1200)
  }

  function handleEnterSelection() {
    if (exactMatchedFood) {
      handleSelectFood(exactMatchedFood)
      return
    }

    if (filteredFoods.length > 0) {
      handleSelectFood(filteredFoods[0])
    }
  }

  const topProteinFoods = useMemo(
    () => [...foods].sort((a, b) => b.p - a.p).slice(0, 7),
    [],
  )

  async function handleSignIn() {
    setAuthError('')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setAuthError(error.message)
      return
    }

    setSession(data.session)
    if (data.user?.id) {
      await loadTodayEntries(data.user.id)
    }
  }

  async function handleSignUp() {
    setAuthError('')
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (error) {
      setAuthError(error.message)
      return
    }

    if (data.session) {
      setSession(data.session)
      await loadTodayEntries(data.session.user.id)
      return
    }

    setAuthError('Cuenta creada. Revisa tu correo para confirmar el acceso.')
  }

  async function handleClearLog() {
    if (!session?.user?.id) return

    const today = toTodayDateString()
    const { error } = await supabase
      .from('daily_log_entries')
      .delete()
      .eq('user_id', session.user.id)
      .eq('logged_on', today)

    if (error) {
      setAuthError(error.message)
      return
    }

    setLogEntries([])
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setSession(null)
    setLogEntries([])
  }

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
        <div className="card auth-card">
          <div className="card-header">Cuenta</div>
          {authLoading ? (
            <p>Cargando sesion...</p>
          ) : session ? (
            <div className="auth-row">
              <span>{session.user.email}</span>
              <button className="btn btn-sm btn-outline" type="button" onClick={handleSignOut}>
                Cerrar sesion
              </button>
            </div>
          ) : (
            <div className="auth-form">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <div className="auth-actions">
                <button className="btn btn-sm" type="button" onClick={handleSignIn}>
                  Iniciar sesion
                </button>
                <button className="btn btn-sm btn-outline" type="button" onClick={handleSignUp}>
                  Crear cuenta
                </button>
              </div>
            </div>
          )}
          {authError ? <p className="auth-error">{authError}</p> : null}
        </div>

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
            if (
              selectedFood &&
              value.trim().toLowerCase() !== selectedFood.name.es.toLowerCase()
            ) {
              setSelectedFood(null)
            }
          }}
          onSelectFood={handleSelectFood}
          onClear={() => {
            setQuery('')
            setSelectedFood(null)
            setShowDropdown(false)
          }}
          onOpenDropdown={() => setShowDropdown(true)}
          onEnterSelect={handleEnterSelection}
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
          canAddToLog={Boolean(session && activeFood && computedMacros && !saving)}
          onAddToLog={addToLog}
          buttonText={
            saving ? 'Guardando...' : addedFeedback ? '✅ Anadido' : '➕ Anadir al Registro'
          }
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

        <DailyLog entries={logEntries} onClear={handleClearLog} />
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
