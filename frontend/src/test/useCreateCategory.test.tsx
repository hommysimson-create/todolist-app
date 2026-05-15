import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../api/categoryApi', () => ({
  createCategory: vi.fn(),
}))

import { createCategory } from '../api/categoryApi'
import { useCreateCategory } from '../hooks/categories/useCreateCategory'
import type { Category } from '../types/category.types'

const mockedCreateCategory = vi.mocked(createCategory)

const mockCategory: Category = {
  id: 'cat-3',
  userId: 'user-1',
  name: '취미',
  isDefault: false,
  createdAt: '2026-01-01T00:00:00Z',
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

describe('useCreateCategory', () => {
  it('useMutation 객체를 반환한다', () => {
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() })
    expect(typeof result.current.mutate).toBe('function')
  })

  it('초기 상태가 idle이다', () => {
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(false)
  })

  it('성공 시 isSuccess가 true가 된다', async () => {
    mockedCreateCategory.mockResolvedValueOnce(mockCategory)
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ name: '취미' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockCategory)
  })

  it('createCategory가 올바른 인자로 호출된다', async () => {
    mockedCreateCategory.mockResolvedValueOnce(mockCategory)
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ name: '취미' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedCreateCategory).toHaveBeenCalledWith({ name: '취미' }, expect.anything())
  })

  it('409 에러 시 isError가 true가 된다', async () => {
    const error = { response: { status: 409, data: { message: '이미 존재하는 카테고리명입니다.' } } }
    mockedCreateCategory.mockRejectedValueOnce(error)
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ name: '업무' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual(error)
  })
})
