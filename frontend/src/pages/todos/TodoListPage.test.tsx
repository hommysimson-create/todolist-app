import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TodoListPage } from './TodoListPage'
import type { Todo } from '../../types/todo.types'
import type { Category } from '../../types/category.types'

vi.mock('../../hooks/todos/useTodos', () => ({ useTodos: vi.fn() }))
vi.mock('../../hooks/todos/useCreateTodo', () => ({ useCreateTodo: vi.fn() }))
vi.mock('../../hooks/todos/useUpdateTodo', () => ({ useUpdateTodo: vi.fn() }))
vi.mock('../../hooks/todos/useDeleteTodo', () => ({ useDeleteTodo: vi.fn() }))
vi.mock('../../hooks/todos/useCompleteTodo', () => ({ useCompleteTodo: vi.fn() }))
vi.mock('../../hooks/categories/useCategories', () => ({ useCategories: vi.fn() }))
vi.mock('../../stores/todoFilterStore', () => ({ useTodoFilterStore: vi.fn() }))

import { useTodos } from '../../hooks/todos/useTodos'
import { useCreateTodo } from '../../hooks/todos/useCreateTodo'
import { useUpdateTodo } from '../../hooks/todos/useUpdateTodo'
import { useDeleteTodo } from '../../hooks/todos/useDeleteTodo'
import { useCompleteTodo } from '../../hooks/todos/useCompleteTodo'
import { useCategories } from '../../hooks/categories/useCategories'
import { useTodoFilterStore } from '../../stores/todoFilterStore'

const categories: Category[] = [
  { id: 'cat-1', userId: null, name: '업무', isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
]

const todos: Todo[] = [
  {
    id: 'todo-1', userId: 'user-1', categoryId: 'cat-1',
    title: '테스트 할일', description: null, dueDate: null,
    isCompleted: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
]

const mockCreateMutate = vi.fn()
const mockUpdateMutate = vi.fn()
const mockDeleteMutate = vi.fn()
const mockCompleteMutate = vi.fn()
const mockSetFilter = vi.fn()
const mockResetFilter = vi.fn()

function setupMocks(overrides: {
  isLoading?: boolean
  isError?: boolean
  todosData?: Todo[]
} = {}) {
  vi.mocked(useTodos).mockReturnValue({
    data: overrides.todosData ?? todos,
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
  } as ReturnType<typeof useTodos>)

  vi.mocked(useCategories).mockReturnValue({
    data: categories,
  } as ReturnType<typeof useCategories>)

  vi.mocked(useCreateTodo).mockReturnValue({
    mutate: mockCreateMutate,
    isPending: false,
  } as ReturnType<typeof useCreateTodo>)

  vi.mocked(useUpdateTodo).mockReturnValue({
    mutate: mockUpdateMutate,
    isPending: false,
  } as ReturnType<typeof useUpdateTodo>)

  vi.mocked(useDeleteTodo).mockReturnValue({
    mutate: mockDeleteMutate,
  } as ReturnType<typeof useDeleteTodo>)

  vi.mocked(useCompleteTodo).mockReturnValue({
    mutate: mockCompleteMutate,
  } as ReturnType<typeof useCompleteTodo>)

  vi.mocked(useTodoFilterStore).mockReturnValue({
    categoryId: undefined,
    startDate: undefined,
    endDate: undefined,
    isCompleted: undefined,
    setFilter: mockSetFilter,
    resetFilter: mockResetFilter,
    getFilters: () => ({}),
  } as ReturnType<typeof useTodoFilterStore>)
}

function renderPage() {
  return render(
    <MemoryRouter>
      <TodoListPage />
    </MemoryRouter>
  )
}

describe('TodoListPage', () => {
  beforeEach(() => {
    setupMocks()
    vi.clearAllMocks()
    setupMocks()
  })

  it('페이지 제목 "할일 목록"이 렌더링된다', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: '할일 목록' })).toBeInTheDocument()
  })

  it('"새 할일 추가" 버튼이 렌더링된다', () => {
    renderPage()
    expect(screen.getByRole('button', { name: '새 할일 추가' })).toBeInTheDocument()
  })

  it('TodoFilter가 렌더링된다', () => {
    renderPage()
    expect(screen.getByRole('search', { name: '할일 필터' })).toBeInTheDocument()
  })

  it('로딩 중일 때 Spinner가 표시된다', () => {
    setupMocks({ isLoading: true, todosData: [] })
    renderPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('로딩 중일 때 TodoList가 표시되지 않는다', () => {
    setupMocks({ isLoading: true, todosData: [] })
    renderPage()
    expect(screen.queryByRole('list', { name: '할일 목록' })).not.toBeInTheDocument()
  })

  it('에러 발생 시 ErrorMessage가 표시된다', () => {
    setupMocks({ isError: true, todosData: [] })
    renderPage()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('에러 발생 시 TodoList가 표시되지 않는다', () => {
    setupMocks({ isError: true, todosData: [] })
    renderPage()
    expect(screen.queryByRole('list', { name: '할일 목록' })).not.toBeInTheDocument()
  })

  it('데이터 로드 완료 시 할일 목록이 렌더링된다', () => {
    renderPage()
    expect(screen.getByText('테스트 할일')).toBeInTheDocument()
  })

  it('"새 할일 추가" 버튼 클릭 시 TodoForm 모달이 열린다', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '새 할일 추가' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('"새 할일 추가" 클릭 시 신규 등록 모드로 열린다', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '새 할일 추가' }))
    expect(screen.getByText('새 할일 추가', { selector: 'h2' })).toBeInTheDocument()
  })

  it('수정 버튼 클릭 시 수정 모드로 TodoForm이 열린다', () => {
    renderPage()
    fireEvent.click(screen.getByText('수정'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('할일 수정')).toBeInTheDocument()
  })

  it('모달 닫기 클릭 시 모달이 닫힌다', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '새 할일 추가' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('삭제 버튼 클릭 시 window.confirm이 호출된다', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPage()
    fireEvent.click(screen.getByText('삭제'))
    expect(confirmSpy).toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('confirm 취소 시 deleteTodo.mutate가 호출되지 않는다', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPage()
    fireEvent.click(screen.getByText('삭제'))
    expect(mockDeleteMutate).not.toHaveBeenCalled()
    vi.restoreAllMocks()
    setupMocks()
  })

  it('confirm 확인 시 deleteTodo.mutate가 해당 id로 호출된다', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()
    fireEvent.click(screen.getByText('삭제'))
    expect(mockDeleteMutate).toHaveBeenCalledWith('todo-1')
    vi.restoreAllMocks()
    setupMocks()
  })

  it('완료 체크박스 클릭 시 completeTodo.mutate가 해당 id로 호출된다', () => {
    renderPage()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(mockCompleteMutate).toHaveBeenCalledWith('todo-1')
  })

  it('신규 등록 폼 제출 시 createTodo.mutate가 호출된다', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '새 할일 추가' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByPlaceholderText('할일 제목을 입력하세요'), { target: { value: '새 할일' } })
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: 'cat-1' } })
    fireEvent.click(within(dialog).getByRole('button', { name: '등록' }))
    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ title: '새 할일', categoryId: 'cat-1' }),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it('수정 폼 제출 시 updateTodo.mutate가 호출된다', () => {
    renderPage()
    fireEvent.click(screen.getByText('수정'))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByDisplayValue('테스트 할일'), { target: { value: '수정된 할일' } })
    fireEvent.click(within(dialog).getByRole('button', { name: '저장' }))
    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'todo-1', data: expect.objectContaining({ title: '수정된 할일' }) }),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it('createTodo 성공 후 모달이 닫힌다', () => {
    mockCreateMutate.mockImplementation((_data: unknown, opts: { onSuccess?: () => void }) => {
      opts?.onSuccess?.()
    })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '새 할일 추가' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByPlaceholderText('할일 제목을 입력하세요'), { target: { value: '새 할일' } })
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: 'cat-1' } })
    fireEvent.click(within(dialog).getByRole('button', { name: '등록' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('TodoFilter onApply 호출 시 setFilter가 호출된다', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '적용' }))
    expect(mockSetFilter).toHaveBeenCalled()
  })

  it('TodoFilter onReset 호출 시 resetFilter가 호출된다', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '초기화' }))
    expect(mockResetFilter).toHaveBeenCalled()
  })

  describe('완료 토글 통합 (FE-16)', () => {
    it('완료된 할일에 todo-card--completed 클래스가 적용된다', () => {
      setupMocks({
        todosData: [{ ...todos[0], isCompleted: true }],
      })
      const { container } = renderPage()
      expect(container.querySelector('.todo-card--completed')).toBeInTheDocument()
    })

    it('완료된 할일의 체크박스가 checked 상태다', () => {
      setupMocks({
        todosData: [{ ...todos[0], isCompleted: true }],
      })
      renderPage()
      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('미완료 할일에는 todo-card--completed 클래스가 없다', () => {
      const { container } = renderPage()
      expect(container.querySelector('.todo-card--completed')).not.toBeInTheDocument()
    })

    it('체크박스 클릭 시 completeTodo.mutate가 해당 todo id로 호출된다', () => {
      renderPage()
      fireEvent.click(screen.getByRole('checkbox', { name: '테스트 할일 완료 토글' }))
      expect(mockCompleteMutate).toHaveBeenCalledWith('todo-1')
    })
  })
})
