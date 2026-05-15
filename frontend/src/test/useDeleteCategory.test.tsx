import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../api/categoryApi', () => ({
  deleteCategory: vi.fn(),
}))

import { deleteCategory } from '../api/categoryApi'
import { useDeleteCategory } from '../hooks/categories/useDeleteCategory'

const mockedDeleteCategory = vi.mocked(deleteCategory)

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

describe('useDeleteCategory', () => {
  it('useMutation 객체를 반환한다', () => {
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() })
    expect(typeof result.current.mutate).toBe('function')
  })

  it('초기 상태가 idle이다', () => {
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(false)
  })

  it('성공 시 isSuccess가 true가 된다', async () => {
    mockedDeleteCategory.mockResolvedValueOnce({ data: undefined } as any)
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate('cat-2')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('deleteCategory가 id로 호출된다', async () => {
    mockedDeleteCategory.mockResolvedValueOnce({ data: undefined } as any)
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate('cat-2')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedDeleteCategory).toHaveBeenCalledWith('cat-2', expect.anything())
  })

  it('403 에러 시 isError가 true가 된다 (기본 카테고리)', async () => {
    const error = { response: { status: 403, data: { message: '기본 카테고리는 삭제할 수 없습니다.' } } }
    mockedDeleteCategory.mockRejectedValueOnce(error)
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate('cat-1')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual(error)
  })

  it('409 에러 시 isError가 true가 된다 (할일 연결됨)', async () => {
    const error = { response: { status: 409, data: { message: '해당 카테고리에 연결된 할일이 있어 삭제할 수 없습니다.' } } }
    mockedDeleteCategory.mockRejectedValueOnce(error)
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate('cat-2')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual(error)
  })
})
