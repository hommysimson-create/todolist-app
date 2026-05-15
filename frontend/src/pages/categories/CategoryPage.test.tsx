import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CategoryPage } from './CategoryPage'
import type { Category } from '../../types/category.types'

vi.mock('../../hooks/categories/useCategories', () => ({ useCategories: vi.fn() }))
vi.mock('../../hooks/categories/useCreateCategory', () => ({ useCreateCategory: vi.fn() }))
vi.mock('../../hooks/categories/useDeleteCategory', () => ({ useDeleteCategory: vi.fn() }))
vi.mock('../../utils/getErrorMessage', () => ({ getErrorMessage: vi.fn((err: Error) => err.message) }))

import { useCategories } from '../../hooks/categories/useCategories'
import { useCreateCategory } from '../../hooks/categories/useCreateCategory'
import { useDeleteCategory } from '../../hooks/categories/useDeleteCategory'

const defaultCategories: Category[] = [
  { id: 'default-1', userId: null, name: '업무', isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'default-2', userId: null, name: '개인', isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
]

const customCategories: Category[] = [
  { id: 'custom-1', userId: 'user-1', name: '사이드프로젝트', isDefault: false, createdAt: '2026-01-01T00:00:00Z' },
]

const mockCreateMutate = vi.fn()
const mockDeleteMutate = vi.fn()

function setupMocks(overrides: {
  isLoading?: boolean
  isError?: boolean
  categoriesData?: Category[]
} = {}) {
  vi.mocked(useCategories).mockReturnValue({
    data: overrides.categoriesData ?? [...defaultCategories, ...customCategories],
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
  } as ReturnType<typeof useCategories>)

  vi.mocked(useCreateCategory).mockReturnValue({
    mutate: mockCreateMutate,
    isPending: false,
  } as ReturnType<typeof useCreateCategory>)

  vi.mocked(useDeleteCategory).mockReturnValue({
    mutate: mockDeleteMutate,
    isPending: false,
  } as ReturnType<typeof useDeleteCategory>)
}

describe('CategoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('페이지 제목 "카테고리 관리"가 렌더링된다', () => {
    render(<CategoryPage />)
    expect(screen.getByRole('heading', { name: '카테고리 관리' })).toBeInTheDocument()
  })

  it('새 카테고리 추가 입력 필드가 렌더링된다', () => {
    render(<CategoryPage />)
    expect(screen.getByPlaceholderText('카테고리명을 입력하세요')).toBeInTheDocument()
  })

  it('"추가" 버튼이 렌더링된다', () => {
    render(<CategoryPage />)
    expect(screen.getByRole('button', { name: '추가' })).toBeInTheDocument()
  })

  it('로딩 중일 때 Spinner가 표시된다', () => {
    setupMocks({ isLoading: true, categoriesData: [] })
    render(<CategoryPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('로딩 중일 때 카테고리 목록이 표시되지 않는다', () => {
    setupMocks({ isLoading: true, categoriesData: [] })
    render(<CategoryPage />)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('카테고리 조회 실패 시 ErrorMessage가 표시된다', () => {
    setupMocks({ isError: true, categoriesData: [] })
    render(<CategoryPage />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('기본 카테고리가 목록에 렌더링된다', () => {
    render(<CategoryPage />)
    expect(screen.getByText('업무')).toBeInTheDocument()
    expect(screen.getByText('개인')).toBeInTheDocument()
  })

  it('기본 카테고리에 [기본] 배지가 표시된다', () => {
    render(<CategoryPage />)
    const badges = screen.getAllByText('기본')
    expect(badges.length).toBe(defaultCategories.length)
  })

  it('기본 카테고리의 삭제 버튼이 disabled이다', () => {
    render(<CategoryPage />)
    const list = screen.getByRole('list', { name: '기본 카테고리 목록' })
    const deleteButtons = list.querySelectorAll('button')
    deleteButtons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it('사용자 정의 카테고리가 렌더링된다', () => {
    render(<CategoryPage />)
    expect(screen.getByText('사이드프로젝트')).toBeInTheDocument()
  })

  it('사용자 정의 카테고리의 삭제 버튼이 활성화된다', () => {
    render(<CategoryPage />)
    const list = screen.getByRole('list', { name: '사용자 정의 카테고리 목록' })
    const deleteButton = list.querySelector('button')
    expect(deleteButton).not.toBeDisabled()
  })

  it('사용자 정의 카테고리가 없으면 빈 상태 메시지가 표시된다', () => {
    setupMocks({ categoriesData: defaultCategories })
    render(<CategoryPage />)
    expect(screen.getByText('사용자 정의 카테고리가 없습니다.')).toBeInTheDocument()
  })

  it('빈 이름으로 추가 시 에러 메시지가 표시되고 mutate가 호출되지 않는다', () => {
    render(<CategoryPage />)
    fireEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(screen.getByText('카테고리명을 입력해주세요.')).toBeInTheDocument()
    expect(mockCreateMutate).not.toHaveBeenCalled()
  })

  it('공백만 입력 시 mutate가 호출되지 않는다', () => {
    render(<CategoryPage />)
    fireEvent.change(screen.getByPlaceholderText('카테고리명을 입력하세요'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(mockCreateMutate).not.toHaveBeenCalled()
  })

  it('유효한 이름 입력 후 추가 버튼 클릭 시 createCategory.mutate가 호출된다', () => {
    render(<CategoryPage />)
    fireEvent.change(screen.getByPlaceholderText('카테고리명을 입력하세요'), { target: { value: '취미' } })
    fireEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(mockCreateMutate).toHaveBeenCalledWith(
      { name: '취미' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    )
  })

  it('추가 성공 후 입력 필드가 초기화된다', () => {
    mockCreateMutate.mockImplementation((_data: unknown, opts: { onSuccess?: () => void }) => {
      opts?.onSuccess?.()
    })
    render(<CategoryPage />)
    const input = screen.getByPlaceholderText('카테고리명을 입력하세요')
    fireEvent.change(input, { target: { value: '취미' } })
    fireEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(input).toHaveValue('')
  })

  it('추가 실패(409) 시 에러 메시지가 표시된다', () => {
    mockCreateMutate.mockImplementation((_data: unknown, opts: { onError?: (e: Error) => void }) => {
      opts?.onError?.(new Error('이미 존재하는 카테고리명입니다.'))
    })
    render(<CategoryPage />)
    fireEvent.change(screen.getByPlaceholderText('카테고리명을 입력하세요'), { target: { value: '업무' } })
    fireEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(screen.getByText('이미 존재하는 카테고리명입니다.')).toBeInTheDocument()
  })

  it('삭제 버튼 클릭 시 deleteCategory.mutate가 해당 id로 호출된다', () => {
    render(<CategoryPage />)
    const list = screen.getByRole('list', { name: '사용자 정의 카테고리 목록' })
    fireEvent.click(list.querySelector('button')!)
    expect(mockDeleteMutate).toHaveBeenCalledWith(
      'custom-1',
      expect.objectContaining({ onError: expect.any(Function) })
    )
  })

  it('삭제 실패(409) 시 에러 메시지가 표시된다', () => {
    mockDeleteMutate.mockImplementation((_id: string, opts: { onError?: (e: Error) => void }) => {
      opts?.onError?.(new Error('해당 카테고리에 연결된 할일이 있어 삭제할 수 없습니다.'))
    })
    render(<CategoryPage />)
    const list = screen.getByRole('list', { name: '사용자 정의 카테고리 목록' })
    fireEvent.click(list.querySelector('button')!)
    expect(screen.getByText('해당 카테고리에 연결된 할일이 있어 삭제할 수 없습니다.')).toBeInTheDocument()
  })

  it('삭제 실패(403) 시 에러 메시지가 표시된다', () => {
    mockDeleteMutate.mockImplementation((_id: string, opts: { onError?: (e: Error) => void }) => {
      opts?.onError?.(new Error('기본 카테고리는 삭제할 수 없습니다.'))
    })
    render(<CategoryPage />)
    const list = screen.getByRole('list', { name: '사용자 정의 카테고리 목록' })
    fireEvent.click(list.querySelector('button')!)
    expect(screen.getByText('기본 카테고리는 삭제할 수 없습니다.')).toBeInTheDocument()
  })
})
