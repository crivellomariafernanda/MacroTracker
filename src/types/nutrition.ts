export type FoodName = {
  es: string
  en: string
}

export type FoodItem = {
  id: string
  name: FoodName
  cal: number
  p: number
  c: number
  f: number
  isEgg?: boolean
  eggWeight?: number
}

export type Unit = 'g' | 'oz' | 'lb'

export type CalculatedMacros = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type LogEntry = {
  id: number
  foodId: string
  foodName: string
  weightGrams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}
