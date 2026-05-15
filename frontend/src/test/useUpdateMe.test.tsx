import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../api/userApi', () => ({
  updateMe: vi.fn(),
}))

import { updateMe } from '../api/userApi'
import { useUpdateMe } from '../hooks/users/useUpdateMe'
import type { User } from '../types/auth.types'

const mockedUpdateMe = vi.mocked(updateMe)

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: '이수진',
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

describe('useUpdateMe', () => {
  it('useMutation 객체를 반환한다', () => {
    const { result } = renderHook(() => useUpdateMe(), { wrapper: createWrapper() })
    expect(typeof result.current.mutate).toBe('function')
  })

  it('초기 상태가 idle이다', () => {
    const { result } = renderHook(() => useUpdateMe(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(false)
  })

  it('이름 수정 성공 시 isSuccess가 true가 된다', async () => {
    mockedUpdateMe.mockResolvedValueOnce(mockUser)
    const { result } = renderHook(() => useUpdateMe(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ name: '이수진' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockUser)
  })

  it('updateMe가 올바른 인자로 호출된다', async () => {
    mockedUpdateMe.mockResolvedValueOnce(mockUser)
    const { result } = renderHook(() => useUpdateMe(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ name: '이수진' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedUpdateMe).toHaveBeenCalledWith({ name: '이수진' }, expect.anything())
  })

  it('400 에러 시 isError가 true가 된다', async () => {
    const error = { response: { status: 400, data: { message: '비밀번호는 최소 8자 이상이어야 합니다.' } } }
    mockedUpdateMe.mockRejectedValueOnce(error)
    const { result } = renderHook(() => useUpdateMe(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ password: '123' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual(error)
  })
})
