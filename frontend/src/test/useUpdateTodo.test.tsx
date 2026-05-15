import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../api/todoApi', () => ({
  updateTodo: vi.fn(),
}))

import { updateTodo } from '../api/todoApi'
import { useUpdateTodo } from '../hooks/todos/useUpdateTodo'
import type { Todo } from '../types/todo.types'

const mockedUpdateTodo = vi.mocked(updateTodo)

const mockTodo: Todo = {
  id: 'todo-1',
  userId: 'user-1',
  categoryId: 'cat-1',
  title: '수정된 할일',
  description: null,
  dueDate: null,
  isCompleted: false,
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

describe('useUpdateTodo', () => {
  it('useMutation 객체를 반환한다', () => {
    const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper() })
    expect(typeof result.current.mutate).toBe('function')
  })

  it('성공 시 isSuccess가 true가 된다', async () => {
    mockedUpdateTodo.mockResolvedValueOnce(mockTodo)
    const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ id: 'todo-1', data: { title: '수정된 할일' } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTodo)
  })

  it('updateTodo를 id와 data로 호출한다', async () => {
    mockedUpdateTodo.mockResolvedValueOnce(mockTodo)
    const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ id: 'todo-1', data: { title: '수정된 할일' } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedUpdateTodo).toHaveBeenCalledWith('todo-1', { title: '수정된 할일' })
  })

  it('실패 시 isError가 true가 된다', async () => {
    mockedUpdateTodo.mockRejectedValueOnce(new Error('403'))
    const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ id: 'todo-1', data: { title: '수정' } })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('null 값으로 필드를 제거할 수 있다', async () => {
    mockedUpdateTodo.mockResolvedValueOnce({ ...mockTodo, dueDate: null })
    const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ id: 'todo-1', data: { dueDate: null } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedUpdateTodo).toHaveBeenCalledWith('todo-1', { dueDate: null })
  })
})
