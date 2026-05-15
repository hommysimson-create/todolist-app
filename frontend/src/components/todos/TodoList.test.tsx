import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TodoList } from './TodoList'
import type { Todo } from '../../types/todo.types'
import type { Category } from '../../types/category.types'

const categories: Category[] = [
  { id: 'cat-1', userId: 'user-1', name: '업무', isDefault: false, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-2', userId: 'user-1', name: '개인', isDefault: false, createdAt: '2026-01-01T00:00:00Z' },
]

const makeTodo = (id: string, categoryId = 'cat-1'): Todo => ({
  id,
  userId: 'user-1',
  categoryId,
  title: `할일 ${id}`,
  description: null,
  dueDate: null,
  isCompleted: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

describe('TodoList', () => {
  it('빈 배열이면 빈 상태 메시지를 표시한다', () => {
    render(<TodoList todos={[]} categories={categories} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('할일이 없습니다. 새 할일을 추가해보세요!')).toBeInTheDocument()
  })

  it('할일 목록을 렌더링한다', () => {
    const todos = [makeTodo('1'), makeTodo('2')]
    render(<TodoList todos={todos} categories={categories} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('할일 1')).toBeInTheDocument()
    expect(screen.getByText('할일 2')).toBeInTheDocument()
  })

  it('목록에 aria-label="할일 목록"이 있다', () => {
    const todos = [makeTodo('1')]
    render(<TodoList todos={todos} categories={categories} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole('list', { name: '할일 목록' })).toBeInTheDocument()
  })

  it('각 할일에 맞는 카테고리를 전달한다', () => {
    const todos = [makeTodo('1', 'cat-1'), makeTodo('2', 'cat-2')]
    render(<TodoList todos={todos} categories={categories} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('업무')).toBeInTheDocument()
    expect(screen.getByText('개인')).toBeInTheDocument()
  })

  it('카테고리가 매칭되지 않으면 미분류를 표시한다', () => {
    const todos = [makeTodo('1', 'unknown-cat')]
    render(<TodoList todos={todos} categories={categories} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('미분류')).toBeInTheDocument()
  })

  it('할일 개수만큼 카드를 렌더링한다', () => {
    const todos = [makeTodo('1'), makeTodo('2'), makeTodo('3')]
    render(<TodoList todos={todos} categories={categories} onComplete={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
  })
})
