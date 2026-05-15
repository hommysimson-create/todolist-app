import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../api/userApi', () => ({
  getMe: vi.fn(),
}))

import { getMe } from '../api/userApi'
import { useMe } from '../hooks/users/useMe'
import type { User } from '../types/auth.types'

const mockedGetMe = vi.mocked(getMe)

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: '김민준',
  theme: 'light',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

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

describe('useMe', () => {
  it('useQuery 객체를 반환한다', () => {
    mockedGetMe.mockResolvedValueOnce(mockUser)
    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() })
    expect(typeof result.current.isLoading).toBe('boolean')
  })

  it('사용자 정보를 반환한다', async () => {
    mockedGetMe.mockResolvedValueOnce(mockUser)
    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockUser)
  })

  it('queryKey가 me이다', async () => {
    mockedGetMe.mockResolvedValueOnce(mockUser)
    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGetMe).toHaveBeenCalledTimes(1)
  })

  it('API 에러 시 isError가 true가 된다', async () => {
    mockedGetMe.mockRejectedValueOnce(new Error('401'))
    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('이메일과 이름을 포함한다', async () => {
    mockedGetMe.mockResolvedValueOnce(mockUser)
    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.email).toBe('test@example.com')
    expect(result.current.data?.name).toBe('김민준')
  })
})
