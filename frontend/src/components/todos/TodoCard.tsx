import { useTranslation } from 'react-i18next'
import './TodoCard.css'
import { Button } from '../common/Button'
import type { Todo } from '../../types/todo.types'
import type { Category } from '../../types/category.types'

interface TodoCardProps {
  todo: Todo
  category?: Category
  onComplete: (id: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
}

export function TodoCard({ todo, category, onComplete, onEdit, onDelete }: TodoCardProps) {
  const { t } = useTranslation()
  const categoryName = category
    ? (category.isDefault ? t(`category.default.${category.name}`, { defaultValue: category.name }) : category.name)
    : t('todoCard.uncategorized')

  return (
    <div className={`todo-card${todo.isCompleted ? ' todo-card--completed' : ''}`}>
      <div className="todo-card__check">
        <input
          type="checkbox"
          className="todo-card__checkbox"
          checked={todo.isCompleted}
          onChange={() => onComplete(todo.id)}
          aria-label={t('todoCard.complete.toggle', { title: todo.title })}
        />
      </div>
      <div className="todo-card__body">
        <p className="todo-card__title">{todo.title}</p>
        {todo.description && (
          <p className="todo-card__description">{todo.description}</p>
        )}
        <div className="todo-card__meta">
          <span className="todo-card__badge">{categoryName}</span>
          {todo.dueDate && (
            <span className="todo-card__due">{todo.dueDate}</span>
          )}
        </div>
      </div>
      <div className="todo-card__actions">
        <Button variant="secondary" onClick={() => onEdit(todo)} aria-label={t('todoCard.edit')}>
          {t('todoCard.edit')}
        </Button>
        <Button variant="danger" onClick={() => onDelete(todo.id)} aria-label={t('todoCard.delete')}>
          {t('todoCard.delete')}
        </Button>
      </div>
    </div>
  )
}
