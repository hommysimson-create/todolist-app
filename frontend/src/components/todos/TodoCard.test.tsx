import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TodoCard } from './TodoCard'
import type { Todo } from '../../types/todo.types'
import type { Category } from '../../types/category.types'

const baseTodo: Todo = {
  id: 'todo-1',
  userId: 'user-1',
  categoryId: 'cat-1',
  title: '테스트 할일',
  description: null,
  dueDate: null,
  isCompleted: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const baseCategory: Category = {
  id: 'cat-1',
  userId: 'user-1',
  name: '업무',
  isDefault: false,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('TodoCard', () => {
  it('제목을 렌더링한다', () => {
    render(<TodoCard todo={baseTodo} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('테스트 할일')).toBeInTheDocument()
  })

  it('카테고리 이름을 렌더링한다', () => {
    render(<TodoCard todo={baseTodo} category={baseCategory} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('업무')).toBeInTheDocument()
  })

  it('카테고리가 없으면 미분류를 표시한다', () => {
    render(<TodoCard todo={baseTodo} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('미분류')).toBeInTheDocument()
  })

  it('마감일을 렌더링한다', () => {
    const todo = { ...baseTodo, dueDate: '2026-12-31' }
    render(<TodoCard todo={todo} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('2026-12-31')).toBeInTheDocument()
  })

  it('마감일이 없으면 렌더링하지 않는다', () => {
    render(<TodoCard todo={baseTodo} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument()
  })

  it('설명을 렌더링한다', () => {
    const todo = { ...baseTodo, description: '상세 설명입니다' }
    render(<TodoCard todo={todo} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('상세 설명입니다')).toBeInTheDocument()
  })

  it('설명이 없으면 렌더링하지 않는다', () => {
    render(<TodoCard todo={baseTodo} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByText('상세 설명입니다')).not.toBeInTheDocument()
  })

  it('완료 상태일 때 todo-card--completed 클래스가 적용된다', () => {
    const todo = { ...baseTodo, isCompleted: true }
    const { container } = render(<TodoCard todo={todo} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(container.firstChild).toHaveClass('todo-card--completed')
  })

  it('미완료 상태일 때 todo-card--completed 클래스가 없다', () => {
    const { container } = render(<TodoCard todo={baseTodo} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(container.firstChild).not.toHaveClass('todo-card--completed')
  })

  it('체크박스 변경 시 onComplete를 호출한다', () => {
    const onComplete = vi.fn()
    render(<TodoCard todo={baseTodo} onComplete={onComplete} onEdit={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onComplete).toHaveBeenCalledWith('todo-1')
  })

  it('수정 버튼 클릭 시 onEdit를 호출한다', () => {
    const onEdit = vi.fn()
    render(<TodoCard todo={baseTodo} onComplete={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByText('수정'))
    expect(onEdit).toHaveBeenCalledWith(baseTodo)
  })

  it('삭제 버튼 클릭 시 onDelete를 호출한다', () => {
    const onDelete = vi.fn()
    render(<TodoCard todo={baseTodo} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByText('삭제'))
    expect(onDelete).toHaveBeenCalledWith('todo-1')
  })

  it('체크박스에 올바른 aria-label이 있다', () => {
    render(<TodoCard todo={baseTodo} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole('checkbox', { name: '테스트 할일 완료 토글' })).toBeInTheDocument()
  })

  it('완료 상태일 때 체크박스가 checked이다', () => {
    const todo = { ...baseTodo, isCompleted: true }
    render(<TodoCard todo={todo} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
