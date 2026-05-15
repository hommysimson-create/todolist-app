import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosResponse } from 'axios'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import client from '../api/client'
import { getTodos, createTodo, updateTodo, deleteTodo, toggleTodoComplete } from '../api/todoApi'
import type { Todo } from '../types/todo.types'

const mockTodo: Todo = {
  id: 'todo-1',
  userId: 'user-1',
  categoryId: 'cat-1',
  title: '테스트 할일',
  description: null,
  dueDate: null,
  isCompleted: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const mockedClient = vi.mocked(client)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('todoApi', () => {
  describe('getTodos()', () => {
    it('GET /api/todos를 호출한다', async () => {
      ;(mockedClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [mockTodo],
      } as AxiosResponse)

      const result = await getTodos()
      expect(mockedClient.get).toHaveBeenCalledWith('/api/todos', { params: undefined })
      expect(result).toEqual([mockTodo])
    })

    it('필터 파라미터를 전달한다', async () => {
      ;(mockedClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [],
      } as AxiosResponse)

      const filters = { categoryId: 'cat-1', isCompleted: false }
      await getTodos(filters)
      expect(mockedClient.get).toHaveBeenCalledWith('/api/todos', { params: filters })
    })

    it('응답 data 배열을 반환한다', async () => {
      ;(mockedClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [mockTodo],
      } as AxiosResponse)

      const result = await getTodos()
      expect(Array.isArray(result)).toBe(true)
      expect(result[0].id).toBe('todo-1')
    })
  })

  describe('createTodo()', () => {
    it('POST /api/todos를 호출한다', async () => {
      ;(mockedClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockTodo,
      } as AxiosResponse)

      const input = { title: '테스트 할일', categoryId: 'cat-1' }
      const result = await createTodo(input)
      expect(mockedClient.post).toHaveBeenCalledWith('/api/todos', input)
      expect(result).toEqual(mockTodo)
    })

    it('에러를 그대로 전파한다', async () => {
      const error = { response: { status: 400, data: { message: '제목은 필수입니다.' } } }
      ;(mockedClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error)

      await expect(createTodo({ title: '', categoryId: 'cat-1' })).rejects.toEqual(error)
    })
  })

  describe('updateTodo()', () => {
    it('PATCH /api/todos/:id를 호출한다', async () => {
      ;(mockedClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { ...mockTodo, title: '수정된 할일' },
      } as AxiosResponse)

      const result = await updateTodo('todo-1', { title: '수정된 할일' })
      expect(mockedClient.patch).toHaveBeenCalledWith('/api/todos/todo-1', { title: '수정된 할일' })
      expect(result.title).toBe('수정된 할일')
    })

    it('403 에러를 전파한다', async () => {
      const error = { response: { status: 403, data: { message: '접근 권한이 없습니다.' } } }
      ;(mockedClient.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error)

      await expect(updateTodo('todo-1', { title: '수정' })).rejects.toEqual(error)
    })
  })

  describe('deleteTodo()', () => {
    it('DELETE /api/todos/:id를 호출한다', async () => {
      ;(mockedClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: undefined })

      await deleteTodo('todo-1')
      expect(mockedClient.delete).toHaveBeenCalledWith('/api/todos/todo-1')
    })

    it('404 에러를 전파한다', async () => {
      const error = { response: { status: 404, data: { message: '존재하지 않는 할일입니다.' } } }
      ;(mockedClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error)

      await expect(deleteTodo('todo-999')).rejects.toEqual(error)
    })
  })

  describe('toggleTodoComplete()', () => {
    it('PATCH /api/todos/:id/complete를 호출한다', async () => {
      ;(mockedClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { ...mockTodo, isCompleted: true },
      } as AxiosResponse)

      const result = await toggleTodoComplete('todo-1')
      expect(mockedClient.patch).toHaveBeenCalledWith('/api/todos/todo-1/complete')
      expect(result.isCompleted).toBe(true)
    })

    it('완료 → 미완료로 토글된다', async () => {
      ;(mockedClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { ...mockTodo, isCompleted: false },
      } as AxiosResponse)

      const result = await toggleTodoComplete('todo-1')
      expect(result.isCompleted).toBe(false)
    })
  })
})
