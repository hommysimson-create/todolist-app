import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../api/todoApi', () => ({
  createTodo: vi.fn(),
}))

import { createTodo } from '../api/todoApi'
import { useCreateTodo } from '../hooks/todos/useCreateTodo'
import type { Todo } from '../types/todo.types'

const mockedCreateTodo = vi.mocked(createTodo)

const mockTodo: Todo = {
  id: 'todo-1',
  userId: 'user-1',
  categoryId: 'cat-1',
  title: '새 할일',
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

describe('useCreateTodo', () => {
  it('useMutation 객체를 반환한다', () => {
    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper() })
    expect(typeof result.current.mutate).toBe('function')
  })

  it('초기 상태가 idle이다', () => {
    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })

  it('성공 시 isSuccess가 true가 된다', async () => {
    mockedCreateTodo.mockResolvedValueOnce(mockTodo)
    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ title: '새 할일', categoryId: 'cat-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTodo)
  })

  it('성공 시 createTodo가 올바른 인자로 호출된다', async () => {
    mockedCreateTodo.mockResolvedValueOnce(mockTodo)
    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper() })
    const input = { title: '새 할일', categoryId: 'cat-1' }

    act(() => {
      result.current.mutate(input)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedCreateTodo).toHaveBeenCalledWith(input, expect.anything())
  })

  it('실패 시 isError가 true가 된다', async () => {
    mockedCreateTodo.mockRejectedValueOnce(new Error('400'))
    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ title: '', categoryId: 'cat-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
