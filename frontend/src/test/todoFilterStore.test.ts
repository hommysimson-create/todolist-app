import { describe, it, expect, beforeEach } from 'vitest'
import { useTodoFilterStore } from '../stores/todoFilterStore'

beforeEach(() => {
  useTodoFilterStore.getState().resetFilter()
})

describe('todoFilterStore', () => {
  describe('초기 상태', () => {
    it('모든 필터가 undefined이다', () => {
      const state = useTodoFilterStore.getState()
      expect(state.categoryId).toBeUndefined()
      expect(state.startDate).toBeUndefined()
      expect(state.endDate).toBeUndefined()
      expect(state.isCompleted).toBeUndefined()
    })
  })

  describe('setFilter()', () => {
    it('categoryId를 설정한다', () => {
      useTodoFilterStore.getState().setFilter({ categoryId: 'cat-1' })
      expect(useTodoFilterStore.getState().categoryId).toBe('cat-1')
    })

    it('날짜 범위를 설정한다', () => {
      useTodoFilterStore.getState().setFilter({ startDate: '2026-05-01', endDate: '2026-05-31' })
      const state = useTodoFilterStore.getState()
      expect(state.startDate).toBe('2026-05-01')
      expect(state.endDate).toBe('2026-05-31')
    })

    it('isCompleted를 설정한다', () => {
      useTodoFilterStore.getState().setFilter({ isCompleted: true })
      expect(useTodoFilterStore.getState().isCompleted).toBe(true)
    })

    it('여러 필터를 동시에 설정한다', () => {
      useTodoFilterStore.getState().setFilter({
        categoryId: 'cat-2',
        isCompleted: false,
        startDate: '2026-05-01',
      })
      const state = useTodoFilterStore.getState()
      expect(state.categoryId).toBe('cat-2')
      expect(state.isCompleted).toBe(false)
      expect(state.startDate).toBe('2026-05-01')
    })
  })

  describe('resetFilter()', () => {
    it('필터를 초기 상태로 리셋한다', () => {
      useTodoFilterStore.getState().setFilter({ categoryId: 'cat-1', isCompleted: true })
      useTodoFilterStore.getState().resetFilter()
      const state = useTodoFilterStore.getState()
      expect(state.categoryId).toBeUndefined()
      expect(state.isCompleted).toBeUndefined()
    })
  })

  describe('getFilters()', () => {
    it('현재 필터 객체를 반환한다', () => {
      useTodoFilterStore.getState().setFilter({ categoryId: 'cat-1', isCompleted: false })
      const filters = useTodoFilterStore.getState().getFilters()
      expect(filters).toEqual({
        categoryId: 'cat-1',
        isCompleted: false,
        startDate: undefined,
        endDate: undefined,
      })
    })

    it('빈 필터도 객체로 반환한다', () => {
      const filters = useTodoFilterStore.getState().getFilters()
      expect(typeof filters).toBe('object')
    })
  })
})
