import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../api/todoApi', () => ({
  getTodos: vi.fn(),
}))

import { getTodos } from '../api/todoApi'
import { useTodos } from '../hooks/todos/useTodos'
import type { Todo } from '../types/todo.types'

const mockedGetTodos = vi.mocked(getTodos)

const mockTodos: Todo[] = [
  {
    id: 'todo-1',
    userId: 'user-1',
    categoryId: 'cat-1',
    title: '할일 1',
    description: null,
    dueDate: null,
    isCompleted: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTodos', () => {
  it('useQuery 객체를 반환한다', () => {
    mockedGetTodos.mockResolvedValueOnce([])
    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() })
    expect(typeof result.current.data).toBe('undefined')
    expect(typeof result.current.isLoading).toBe('boolean')
  })

  it('할일 목록을 반환한다', async () => {
    mockedGetTodos.mockResolvedValueOnce(mockTodos)
    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTodos)
  })

  it('필터 없이 getTodos를 호출한다', async () => {
    mockedGetTodos.mockResolvedValueOnce([])
    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGetTodos).toHaveBeenCalledWith(undefined)
  })

  it('필터를 전달하면 getTodos에 필터가 전달된다', async () => {
    mockedGetTodos.mockResolvedValueOnce([])
    const filters = { categoryId: 'cat-1', isCompleted: false }
    const { result } = renderHook(() => useTodos(filters), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGetTodos).toHaveBeenCalledWith(filters)
  })

  it('API 에러 시 isError가 true가 된다', async () => {
    mockedGetTodos.mockRejectedValueOnce(new Error('서버 오류'))
    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('queryKey에 filters가 포함된다', () => {
    mockedGetTodos.mockResolvedValueOnce([])
    const filters = { isCompleted: true }
    const { result } = renderHook(() => useTodos(filters), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })
})
