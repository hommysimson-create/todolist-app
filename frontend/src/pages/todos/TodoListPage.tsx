import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './TodoListPage.css'
import { TodoFilter } from '../../components/todos/TodoFilter'
import { TodoList } from '../../components/todos/TodoList'
import { TodoForm } from '../../components/todos/TodoForm'
import { Button } from '../../components/common/Button'
import { Spinner } from '../../components/common/Spinner'
import { ErrorMessage } from '../../components/common/ErrorMessage'
import { useTodos } from '../../hooks/todos/useTodos'
import { useCreateTodo } from '../../hooks/todos/useCreateTodo'
import { useUpdateTodo } from '../../hooks/todos/useUpdateTodo'
import { useDeleteTodo } from '../../hooks/todos/useDeleteTodo'
import { useCompleteTodo } from '../../hooks/todos/useCompleteTodo'
import { useCategories } from '../../hooks/categories/useCategories'
import { useTodoFilterStore } from '../../stores/todoFilterStore'
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoFilters } from '../../types/todo.types'

export function TodoListPage() {
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Todo | undefined>()

  const { categoryId, startDate, endDate, isCompleted, setFilter, resetFilter } = useTodoFilterStore()
  const filters: TodoFilters = {
    ...(categoryId !== undefined ? { categoryId } : {}),
    ...(startDate !== undefined ? { startDate } : {}),
    ...(endDate !== undefined ? { endDate } : {}),
    ...(isCompleted !== undefined ? { isCompleted } : {}),
  }

  const { data: todos = [], isLoading, isError } = useTodos(filters)
  const { data: categories = [] } = useCategories()

  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()
  const completeTodo = useCompleteTodo()

  function handleClose() {
    setFormOpen(false)
    setEditTarget(undefined)
  }

  function handleOpenCreate() {
    setEditTarget(undefined)
    setFormOpen(true)
  }

  function handleEdit(todo: Todo) {
    setEditTarget(todo)
    setFormOpen(true)
  }

  function handleDelete(id: string) {
    if (!window.confirm(t('todos.deleteConfirm'))) return
    deleteTodo.mutate(id)
  }

  function handleComplete(id: string) {
    completeTodo.mutate(id)
  }

  function handleApplyFilter(newFilters: TodoFilters) {
    setFilter(newFilters)
  }

  function handleResetFilter() {
    resetFilter()
  }

  function handleSubmit(data: CreateTodoInput | UpdateTodoInput) {
    if (editTarget) {
      updateTodo.mutate({ id: editTarget.id, data: data as UpdateTodoInput }, {
        onSuccess: handleClose,
      })
    } else {
      createTodo.mutate(data as CreateTodoInput, {
        onSuccess: handleClose,
      })
    }
  }

  return (
    <div className="todo-list-page">
      <div className="todo-list-page__header">
        <h1 className="todo-list-page__title">{t('todos.title')}</h1>
        <Button variant="primary" onClick={handleOpenCreate}>{t('todos.addNew')}</Button>
      </div>

      <TodoFilter
        categories={categories}
        filters={filters}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />

      <div className="todo-list-page__content">
        {isLoading && <Spinner label={t('todos.loading')} />}
        {isError && <ErrorMessage message={t('todos.loadError')} />}
        {!isLoading && !isError && (
          <TodoList
            todos={todos}
            categories={categories}
            onComplete={handleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <TodoForm
        isOpen={formOpen}
        onClose={handleClose}
        categories={categories}
        {...(editTarget ? { initialData: editTarget } : {})}
        onSubmit={handleSubmit}
        isLoading={createTodo.isPending || updateTodo.isPending}
      />
    </div>
  )
}
