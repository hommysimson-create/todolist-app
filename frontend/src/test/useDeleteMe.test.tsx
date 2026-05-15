import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../api/userApi', () => ({
  deleteMe: vi.fn(),
}))

vi.mock('../config/queryClient', () => ({
  queryClient: { clear: vi.fn() },
}))

import { deleteMe } from '../api/userApi'
import { useAuthStore } from '../stores/authStore'
import { useDeleteMe } from '../hooks/users/useDeleteMe'

const mockedDeleteMe = vi.mocked(deleteMe)

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: '김민준',
  createdAt: '',
  updatedAt: '',
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
  useAuthStore.getState().setAuth('token', mockUser)
})

describe('useDeleteMe', () => {
  it('useMutation 객체를 반환한다', () => {
    const { result } = renderHook(() => useDeleteMe(), { wrapper: createWrapper() })
    expect(typeof result.current.mutate).toBe('function')
  })

  it('초기 상태가 idle이다', () => {
    const { result } = renderHook(() => useDeleteMe(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(false)
  })

  it('성공 시 authStore가 초기화된다', async () => {
    mockedDeleteMe.mockResolvedValueOnce({ data: undefined } as any)
    const { result } = renderHook(() => useDeleteMe(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('성공 시 /login으로 navigate한다', async () => {
    mockedDeleteMe.mockResolvedValueOnce({ data: undefined } as any)
    const { result } = renderHook(() => useDeleteMe(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('성공 시 isAuthenticated가 false가 된다', async () => {
    mockedDeleteMe.mockResolvedValueOnce({ data: undefined } as any)
    const { result } = renderHook(() => useDeleteMe(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(useAuthStore.getState().isAuthenticated()).toBe(false)
  })

  it('실패 시 isError가 true가 된다', async () => {
    mockedDeleteMe.mockRejectedValueOnce(new Error('401'))
    const { result } = renderHook(() => useDeleteMe(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('실패 시 authStore가 유지된다', async () => {
    mockedDeleteMe.mockRejectedValueOnce(new Error('401'))
    const { result } = renderHook(() => useDeleteMe(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(useAuthStore.getState().accessToken).toBe('token')
  })
})
