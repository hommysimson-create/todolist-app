import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TodoForm } from './TodoForm'
import type { Todo } from '../../types/todo.types'
import type { Category } from '../../types/category.types'

const categories: Category[] = [
  { id: 'cat-1', userId: 'user-1', name: '업무', isDefault: false, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-2', userId: 'user-1', name: '개인', isDefault: false, createdAt: '2026-01-01T00:00:00Z' },
]

const existingTodo: Todo = {
  id: 'todo-1',
  userId: 'user-1',
  categoryId: 'cat-1',
  title: '기존 할일',
  description: '기존 설명',
  dueDate: '2026-12-31',
  isCompleted: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('TodoForm', () => {
  describe('등록 모드', () => {
    it('모달 제목이 "새 할일 추가"이다', () => {
      render(<TodoForm isOpen onClose={vi.fn()} categories={categories} onSubmit={vi.fn()} />)
      expect(screen.getByText('새 할일 추가')).toBeInTheDocument()
    })

    it('등록 버튼이 렌더링된다', () => {
      render(<TodoForm isOpen onClose={vi.fn()} categories={categories} onSubmit={vi.fn()} />)
      expect(screen.getByRole('button', { name: '등록' })).toBeInTheDocument()
    })

    it('카테고리 옵션이 렌더링된다', () => {
      render(<TodoForm isOpen onClose={vi.fn()} categories={categories} onSubmit={vi.fn()} />)
      expect(screen.getByText('업무')).toBeInTheDocument()
      expect(screen.getByText('개인')).toBeInTheDocument()
    })

    it('제목 없이 제출하면 에러 메시지를 표시한다', async () => {
      render(<TodoForm isOpen onClose={vi.fn()} categories={categories} onSubmit={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: '등록' }))
      await waitFor(() => {
        expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument()
      })
    })

    it('카테고리 없이 제출하면 에러 메시지를 표시한다', async () => {
      render(<TodoForm isOpen onClose={vi.fn()} categories={categories} onSubmit={vi.fn()} />)
      fireEvent.change(screen.getByPlaceholderText('할일 제목을 입력하세요'), { target: { value: '테스트' } })
      fireEvent.click(screen.getByRole('button', { name: '등록' }))
      await waitFor(() => {
        expect(screen.getByText('카테고리를 선택해주세요.')).toBeInTheDocument()
      })
    })

    it('유효한 폼 제출 시 onSubmit을 호출한다', async () => {
      const onSubmit = vi.fn()
      render(<TodoForm isOpen onClose={vi.fn()} categories={categories} onSubmit={onSubmit} />)
      fireEvent.change(screen.getByPlaceholderText('할일 제목을 입력하세요'), { target: { value: '새 할일' } })
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'cat-1' } })
      fireEvent.click(screen.getByRole('button', { name: '등록' }))
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ title: '새 할일', categoryId: 'cat-1' })
        )
      })
    })

    it('description이 비어있으면 undefined로 제출된다', async () => {
      const onSubmit = vi.fn()
      render(<TodoForm isOpen onClose={vi.fn()} categories={categories} onSubmit={onSubmit} />)
      fireEvent.change(screen.getByPlaceholderText('할일 제목을 입력하세요'), { target: { value: '할일' } })
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'cat-1' } })
      fireEvent.click(screen.getByRole('button', { name: '등록' }))
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ description: undefined })
        )
      })
    })

    it('취소 버튼 클릭 시 onClose를 호출한다', () => {
      const onClose = vi.fn()
      render(<TodoForm isOpen onClose={onClose} categories={categories} onSubmit={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: '취소' }))
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('수정 모드', () => {
    it('모달 제목이 "할일 수정"이다', () => {
      render(<TodoForm isOpen onClose={vi.fn()} categories={categories} initialData={existingTodo} onSubmit={vi.fn()} />)
      expect(screen.getByText('할일 수정')).toBeInTheDocument()
    })

    it('저장 버튼이 렌더링된다', () => {
      render(<TodoForm isOpen onClose={vi.fn()} categories={categories} initialData={existingTodo} onSubmit={vi.fn()} />)
      expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
    })

    it('기존 데이터가 폼에 채워진다', () => {
      render(<TodoForm isOpen onClose={vi.fn()} categories={categories} initialData={existingTodo} onSubmit={vi.fn()} />)
      expect(screen.getByDisplayValue('기존 할일')).toBeInTheDocument()
      expect(screen.getByDisplayValue('기존 설명')).toBeInTheDocument()
    })

    it('수정된 데이터로 onSubmit을 호출한다', async () => {
      const onSubmit = vi.fn()
      render(<TodoForm isOpen onClose={vi.fn()} categories={categories} initialData={existingTodo} onSubmit={onSubmit} />)
      fireEvent.change(screen.getByDisplayValue('기존 할일'), { target: { value: '수정된 할일' } })
      fireEvent.click(screen.getByRole('button', { name: '저장' }))
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ title: '수정된 할일' })
        )
      })
    })
  })

  describe('isOpen=false', () => {
    it('모달이 렌더링되지 않는다', () => {
      render(<TodoForm isOpen={false} onClose={vi.fn()} categories={categories} onSubmit={vi.fn()} />)
      expect(screen.queryByText('새 할일 추가')).not.toBeInTheDocument()
    })
  })
})
