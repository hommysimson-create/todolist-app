import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../api/todoApi', () => ({
  deleteTodo: vi.fn(),
}))

import { deleteTodo } from '../api/todoApi'
import { useDeleteTodo } from '../hooks/todos/useDeleteTodo'

const mockedDeleteTodo = vi.mocked(deleteTodo)

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

describe('useDeleteTodo', () => {
  it('useMutation 객체를 반환한다', () => {
    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() })
    expect(typeof result.current.mutate).toBe('function')
  })

  it('초기 상태가 idle이다', () => {
    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(false)
  })

  it('성공 시 isSuccess가 true가 된다', async () => {
    mockedDeleteTodo.mockResolvedValueOnce({ data: undefined } as any)
    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate('todo-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('deleteTodo를 id로 호출한다', async () => {
    mockedDeleteTodo.mockResolvedValueOnce({ data: undefined } as any)
    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate('todo-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedDeleteTodo).toHaveBeenCalledWith('todo-1', expect.anything())
  })

  it('실패 시 isError가 true가 된다', async () => {
    mockedDeleteTodo.mockRejectedValueOnce(new Error('404'))
    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate('todo-999')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
