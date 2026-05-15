import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../api/todoApi', () => ({
  toggleTodoComplete: vi.fn(),
}))

import { toggleTodoComplete } from '../api/todoApi'
import { useCompleteTodo } from '../hooks/todos/useCompleteTodo'
import type { Todo } from '../types/todo.types'

const mockedToggle = vi.mocked(toggleTodoComplete)

const mockTodo: Todo = {
  id: 'todo-1',
  userId: 'user-1',
  categoryId: 'cat-1',
  title: '할일',
  description: null,
  dueDate: null,
  isCompleted: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useCompleteTodo', () => {
  it('useMutation 객체를 반환한다', () => {
    const { result } = renderHook(() => useCompleteTodo(), { wrapper: createWrapper() })
    expect(typeof result.current.mutate).toBe('function')
  })

  it('성공 시 isSuccess가 true가 된다', async () => {
    mockedToggle.mockResolvedValueOnce(mockTodo)
    const { result } = renderHook(() => useCompleteTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate('todo-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTodo)
  })

  it('toggleTodoComplete를 id로 호출한다', async () => {
    mockedToggle.mockResolvedValueOnce(mockTodo)
    const { result } = renderHook(() => useCompleteTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate('todo-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedToggle).toHaveBeenCalledWith('todo-1', expect.anything())
  })

  it('완료 상태를 토글한다 (true → false)', async () => {
    mockedToggle.mockResolvedValueOnce({ ...mockTodo, isCompleted: false })
    const { result } = renderHook(() => useCompleteTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate('todo-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.isCompleted).toBe(false)
  })

  it('실패 시 isError가 true가 된다', async () => {
    mockedToggle.mockRejectedValueOnce(new Error('403'))
    const { result } = renderHook(() => useCompleteTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate('todo-1')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
