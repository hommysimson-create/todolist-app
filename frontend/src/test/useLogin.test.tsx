import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../api/authApi', () => ({
  login: vi.fn(),
}))

import { login } from '../api/authApi'
import { useAuthStore } from '../stores/authStore'
import { useLogin } from '../hooks/auth/useLogin'

const mockedLogin = vi.mocked(login)

const mockResponse = {
  accessToken: 'token-xyz',
  user: { id: 'u-1', email: 'test@example.com', name: '김철수', theme: 'dark', createdAt: '', updatedAt: '' },
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
  useAuthStore.getState().clearAuth()
})

describe('useLogin', () => {
  it('useMutation 객체를 반환한다', () => {
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })
    expect(typeof result.current.mutate).toBe('function')
  })

  it('초기 상태가 idle이다', () => {
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })

  it('성공 시 authStore에 토큰과 유저가 저장된다', async () => {
    mockedLogin.mockResolvedValueOnce(mockResponse)
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ email: 'test@example.com', password: 'pass1234' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('token-xyz')
    expect(state.user).toEqual(mockResponse.user)
  })

  it('성공 시 /todos로 navigate한다', async () => {
    mockedLogin.mockResolvedValueOnce(mockResponse)
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ email: 'test@example.com', password: 'pass1234' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockNavigate).toHaveBeenCalledWith('/todos')
  })

  it('성공 시 isAuthenticated가 true가 된다', async () => {
    mockedLogin.mockResolvedValueOnce(mockResponse)
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ email: 'test@example.com', password: 'pass1234' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(useAuthStore.getState().isAuthenticated()).toBe(true)
  })

  it('실패 시 isError가 true가 된다', async () => {
    const error = new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
    mockedLogin.mockRejectedValueOnce(error)
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ email: 'test@example.com', password: 'wrong' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(error)
  })

  it('실패 시 navigate가 호출되지 않는다', async () => {
    mockedLogin.mockRejectedValueOnce(new Error('401'))
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ email: 'test@example.com', password: 'wrong' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('실패 시 authStore가 초기 상태를 유지한다', async () => {
    mockedLogin.mockRejectedValueOnce(new Error('401'))
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ email: 'test@example.com', password: 'wrong' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(useAuthStore.getState().accessToken).toBeNull()
  })
})
