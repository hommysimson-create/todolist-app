import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './TodoFilter.css'
import { Button } from '../common/Button'
import type { TodoFilters } from '../../types/todo.types'
import type { Category } from '../../types/category.types'

interface TodoFilterProps {
  categories: Category[]
  filters: TodoFilters
  onApply: (filters: TodoFilters) => void
  onReset: () => void
}

export function TodoFilter({ categories, filters, onApply, onReset }: TodoFilterProps) {
  const { t, i18n } = useTranslation()
  const [local, setLocal] = useState<TodoFilters>(filters)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    if (name === 'isCompleted') {
      setLocal((prev) => {
        const next = { ...prev }
        if (value === '') {
          delete next.isCompleted
        } else {
          next.isCompleted = value === 'true'
        }
        return next
      })
    } else {
      setLocal((prev) => ({ ...prev, [name]: value || undefined }))
    }
  }

  function handleApply() {
    onApply(local)
  }

  function handleReset() {
    setLocal({})
    onReset()
  }

  return (
    <div className="todo-filter" role="search" aria-label={t('filter.title')}>
      <div className="todo-filter__row">
        <div className="todo-filter__field">
          <label className="todo-filter__label" htmlFor="filter-category">{t('filter.category')}</label>
          <select
            id="filter-category"
            className="todo-filter__select"
            name="categoryId"
            value={local.categoryId ?? ''}
            onChange={handleChange}
          >
            <option value="">{t('filter.category.all')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="todo-filter__field">
          <label className="todo-filter__label" htmlFor="filter-start">{t('filter.startDate')}</label>
          <input
            id="filter-start"
            className="todo-filter__input"
            type="date"
            name="startDate"
            value={local.startDate ?? ''}
            onChange={handleChange}
            lang={i18n.language}
          />
        </div>

        <div className="todo-filter__field">
          <label className="todo-filter__label" htmlFor="filter-end">{t('filter.endDate')}</label>
          <input
            id="filter-end"
            className="todo-filter__input"
            type="date"
            name="endDate"
            value={local.endDate ?? ''}
            onChange={handleChange}
            lang={i18n.language}
          />
        </div>
      </div>

      <div className="todo-filter__row">
        <fieldset className="todo-filter__fieldset">
          <legend className="todo-filter__label">{t('filter.status')}</legend>
          <div className="todo-filter__radios">
            {[
              { value: '', label: t('filter.status.all') },
              { value: 'false', label: t('filter.status.incomplete') },
              { value: 'true', label: t('filter.status.complete') },
            ].map(({ value, label }) => (
              <label key={value} className="todo-filter__radio-label">
                <input
                  type="radio"
                  name="isCompleted"
                  value={value}
                  checked={(local.isCompleted === undefined ? '' : String(local.isCompleted)) === value}
                  onChange={handleChange}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="todo-filter__buttons">
          <Button variant="secondary" onClick={handleApply}>{t('filter.apply')}</Button>
          <Button variant="secondary" onClick={handleReset}>{t('filter.reset')}</Button>
        </div>
      </div>
    </div>
  )
}
