import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../api/authApi', () => ({
  register: vi.fn(),
}))

import { register } from '../api/authApi'
import { useRegister } from '../hooks/auth/useRegister'

const mockedRegister = vi.mocked(register)

const mockResponse = {
  accessToken: 'token-abc',
  user: { id: '1', email: 'a@b.com', name: '홍길동', createdAt: '', updatedAt: '' },
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

describe('useRegister', () => {
  it('useMutation 객체를 반환한다', () => {
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() })
    expect(typeof result.current.mutate).toBe('function')
    expect(typeof result.current.mutateAsync).toBe('function')
  })

  it('초기 상태가 idle이다', () => {
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('성공 시 isSuccess가 true가 된다', async () => {
    mockedRegister.mockResolvedValueOnce(mockResponse)
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ email: 'a@b.com', password: 'pass1234', name: '홍길동' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockResponse)
  })

  it('성공 시 register 함수가 올바른 인자로 호출된다', async () => {
    mockedRegister.mockResolvedValueOnce(mockResponse)
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() })

    const input = { email: 'a@b.com', password: 'pass1234', name: '홍길동' }
    act(() => {
      result.current.mutate(input)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedRegister).toHaveBeenCalledWith(input, expect.anything())
  })

  it('실패 시 isError가 true가 된다', async () => {
    const error = new Error('이미 사용 중인 이메일입니다.')
    mockedRegister.mockRejectedValueOnce(error)
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ email: 'a@b.com', password: 'pass1234', name: '홍길동' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(error)
  })
})
