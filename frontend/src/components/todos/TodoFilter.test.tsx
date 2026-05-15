import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TodoFilter } from './TodoFilter'
import type { Category } from '../../types/category.types'

const categories: Category[] = [
  { id: 'cat-1', userId: 'user-1', name: '업무', isDefault: false, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-2', userId: 'user-1', name: '개인', isDefault: false, createdAt: '2026-01-01T00:00:00Z' },
]

describe('TodoFilter', () => {
  it('카테고리 셀렉트가 렌더링된다', () => {
    render(<TodoFilter categories={categories} filters={{}} onApply={vi.fn()} onReset={vi.fn()} />)
    expect(screen.getByLabelText('카테고리')).toBeInTheDocument()
  })

  it('카테고리 옵션이 렌더링된다', () => {
    render(<TodoFilter categories={categories} filters={{}} onApply={vi.fn()} onReset={vi.fn()} />)
    expect(screen.getByText('업무')).toBeInTheDocument()
    expect(screen.getByText('개인')).toBeInTheDocument()
  })

  it('시작일 입력이 렌더링된다', () => {
    render(<TodoFilter categories={categories} filters={{}} onApply={vi.fn()} onReset={vi.fn()} />)
    expect(screen.getByLabelText('시작일')).toBeInTheDocument()
  })

  it('종료일 입력이 렌더링된다', () => {
    render(<TodoFilter categories={categories} filters={{}} onApply={vi.fn()} onReset={vi.fn()} />)
    expect(screen.getByLabelText('종료일')).toBeInTheDocument()
  })

  it('완료 여부 라디오 버튼 3개가 렌더링된다', () => {
    render(<TodoFilter categories={categories} filters={{}} onApply={vi.fn()} onReset={vi.fn()} />)
    expect(screen.getByLabelText('전체')).toBeInTheDocument()
    expect(screen.getByLabelText('미완료')).toBeInTheDocument()
    expect(screen.getByLabelText('완료')).toBeInTheDocument()
  })

  it('적용 버튼 클릭 시 onApply를 호출한다', () => {
    const onApply = vi.fn()
    render(<TodoFilter categories={categories} filters={{}} onApply={onApply} onReset={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '적용' }))
    expect(onApply).toHaveBeenCalledWith({})
  })

  it('초기화 버튼 클릭 시 onReset을 호출한다', () => {
    const onReset = vi.fn()
    render(<TodoFilter categories={categories} filters={{}} onApply={vi.fn()} onReset={onReset} />)
    fireEvent.click(screen.getByRole('button', { name: '초기화' }))
    expect(onReset).toHaveBeenCalled()
  })

  it('카테고리 변경 후 적용 시 categoryId가 전달된다', () => {
    const onApply = vi.fn()
    render(<TodoFilter categories={categories} filters={{}} onApply={onApply} onReset={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('카테고리'), { target: { value: 'cat-1' } })
    fireEvent.click(screen.getByRole('button', { name: '적용' }))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'cat-1' }))
  })

  it('완료 라디오 선택 시 isCompleted: true가 전달된다', () => {
    const onApply = vi.fn()
    render(<TodoFilter categories={categories} filters={{}} onApply={onApply} onReset={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('완료'))
    fireEvent.click(screen.getByRole('button', { name: '적용' }))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ isCompleted: true }))
  })

  it('미완료 라디오 선택 시 isCompleted: false가 전달된다', () => {
    const onApply = vi.fn()
    render(<TodoFilter categories={categories} filters={{}} onApply={onApply} onReset={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('미완료'))
    fireEvent.click(screen.getByRole('button', { name: '적용' }))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ isCompleted: false }))
  })

  it('전체 라디오 선택 시 isCompleted: undefined가 전달된다', () => {
    const onApply = vi.fn()
    render(<TodoFilter categories={categories} filters={{ isCompleted: true }} onApply={onApply} onReset={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('전체'))
    fireEvent.click(screen.getByRole('button', { name: '적용' }))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ isCompleted: undefined }))
  })

  it('초기화 후 로컬 상태가 빈 객체로 리셋된다', () => {
    const onApply = vi.fn()
    render(<TodoFilter categories={categories} filters={{ isCompleted: true }} onApply={onApply} onReset={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '초기화' }))
    fireEvent.click(screen.getByRole('button', { name: '적용' }))
    expect(onApply).toHaveBeenCalledWith({})
  })

  it('role="search" aria-label이 있다', () => {
    render(<TodoFilter categories={categories} filters={{}} onApply={vi.fn()} onReset={vi.fn()} />)
    expect(screen.getByRole('search', { name: '할일 필터' })).toBeInTheDocument()
  })

  it('props로 전달된 filters 값이 초기값으로 표시된다', () => {
    render(<TodoFilter categories={categories} filters={{ categoryId: 'cat-1' }} onApply={vi.fn()} onReset={vi.fn()} />)
    expect(screen.getByLabelText('카테고리')).toHaveValue('cat-1')
  })
})
