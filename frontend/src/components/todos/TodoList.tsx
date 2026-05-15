import { useTranslation } from 'react-i18next'
import './TodoList.css'
import { TodoCard } from './TodoCard'
import type { Todo } from '../../types/todo.types'
import type { Category } from '../../types/category.types'

interface TodoListProps {
  todos: Todo[]
  categories: Category[]
  onComplete: (id: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
}

export function TodoList({ todos, categories, onComplete, onEdit, onDelete }: TodoListProps) {
  const { t } = useTranslation()

  if (todos.length === 0) {
    return (
      <div className="todo-list__empty">
        {t('todos.empty')}
      </div>
    )
  }

  return (
    <ul className="todo-list" aria-label={t('todos.title')}>
      {todos.map((todo) => {
        const category = categories.find((c) => c.id === todo.categoryId)
        return (
          <li key={todo.id} className="todo-list__item">
            <TodoCard
              todo={todo}
              category={category}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </li>
        )
      })}
    </ul>
  )
}
