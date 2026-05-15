import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../api/categoryApi', () => ({
  getCategories: vi.fn(),
}))

import { getCategories } from '../api/categoryApi'
import { useCategories } from '../hooks/categories/useCategories'
import type { Category } from '../types/category.types'

const mockedGetCategories = vi.mocked(getCategories)

const mockCategories: Category[] = [
  { id: 'cat-1', userId: null, name: '업무', isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-2', userId: 'user-1', name: '사이드프로젝트', isDefault: false, createdAt: '2026-01-01T00:00:00Z' },
]

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

describe('useCategories', () => {
  it('useQuery 객체를 반환한다', () => {
    mockedGetCategories.mockResolvedValueOnce([])
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() })
    expect(typeof result.current.isLoading).toBe('boolean')
  })

  it('카테고리 목록을 반환한다', async () => {
    mockedGetCategories.mockResolvedValueOnce(mockCategories)
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockCategories)
  })

  it('queryKey가 categories이다', async () => {
    mockedGetCategories.mockResolvedValueOnce([])
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGetCategories).toHaveBeenCalledTimes(1)
  })

  it('API 에러 시 isError가 true가 된다', async () => {
    mockedGetCategories.mockRejectedValueOnce(new Error('서버 오류'))
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('기본 카테고리와 사용자 정의 카테고리를 함께 반환한다', async () => {
    mockedGetCategories.mockResolvedValueOnce(mockCategories)
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const defaultCats = result.current.data?.filter((c) => c.isDefault)
    const userCats = result.current.data?.filter((c) => !c.isDefault)
    expect(defaultCats).toHaveLength(1)
    expect(userCats).toHaveLength(1)
  })
})
