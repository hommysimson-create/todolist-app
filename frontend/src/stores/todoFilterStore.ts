import { create } from 'zustand'
import type { TodoFilters } from '../types/todo.types'

interface TodoFilterState extends TodoFilters {
  setFilter: (filters: Partial<TodoFilters>) => void
  resetFilter: () => void
  getFilters: () => TodoFilters
}

const initialFilters: TodoFilters = {}

export const useTodoFilterStore = create<TodoFilterState>((set, get) => ({
  ...initialFilters,
  setFilter: (filters) => set(filters),
  resetFilter: () => set({ ...initialFilters }),
  getFilters: () => {
    const { categoryId, startDate, endDate, isCompleted } = get()
    return { categoryId, startDate, endDate, isCompleted }
  },
}))
