import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './TodoForm.css'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../types/todo.types'
import type { Category } from '../../types/category.types'

interface TodoFormProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  initialData?: Todo
  onSubmit: (data: CreateTodoInput | UpdateTodoInput) => void
  isLoading?: boolean
}

interface FormState {
  title: string
  description: string
  categoryId: string
  dueDate: string
}

const emptyForm: FormState = {
  title: '',
  description: '',
  categoryId: '',
  dueDate: '',
}

export function TodoForm({ isOpen, onClose, categories, initialData, onSubmit, isLoading = false }: TodoFormProps) {
  const { t, i18n } = useTranslation()
  const isEditMode = !!initialData
  const [form, setForm] = useState<FormState>(emptyForm)
  const [titleError, setTitleError] = useState('')
  const [categoryError, setCategoryError] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          title: initialData.title,
          description: initialData.description ?? '',
          categoryId: initialData.categoryId,
          dueDate: initialData.dueDate ?? '',
        })
      } else {
        setForm(emptyForm)
      }
      setTitleError('')
      setCategoryError('')
    }
  }, [isOpen, initialData])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function validate() {
    let valid = true
    if (!form.title.trim()) {
      setTitleError(t('todoForm.title.required'))
      valid = false
    } else {
      setTitleError('')
    }
    if (!form.categoryId) {
      setCategoryError(t('todoForm.category.required'))
      valid = false
    } else {
      setCategoryError('')
    }
    return valid
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const desc = form.description.trim()
    const due = form.dueDate

    if (isEditMode) {
      const data: UpdateTodoInput = {
        title: form.title.trim(),
        categoryId: form.categoryId,
        description: desc || null,
        dueDate: due || null,
      }
      onSubmit(data)
    } else {
      const data: CreateTodoInput = {
        title: form.title.trim(),
        categoryId: form.categoryId,
        ...(desc ? { description: desc } : {}),
        ...(due ? { dueDate: due } : {}),
      }
      onSubmit(data)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? t('todoForm.edit') : t('todoForm.add')}>
      <form className="todo-form" onSubmit={handleSubmit} noValidate>
        <Input
          label={t('todoForm.title.label')}
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          error={titleError}
          placeholder={t('todoForm.title.placeholder')}
          maxLength={255}
        />

        <div className="todo-form__field">
          <label className="todo-form__label">{t('todoForm.description.label')} <span className="todo-form__optional">{t('todoForm.description.optional')}</span></label>
          <textarea
            className="todo-form__textarea"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder={t('todoForm.description.placeholder')}
            maxLength={1000}
            rows={3}
          />
        </div>

        <div className="todo-form__field">
          <label className="todo-form__label">
            {t('todoForm.category.label')} <span className="todo-form__required" aria-hidden="true"> *</span>
          </label>
          <select
            className={`todo-form__select${categoryError ? ' todo-form__select--error' : ''}`}
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={categoryError ? 'true' : undefined}
          >
            <option value="">{t('todoForm.category.placeholder')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.isDefault ? t(`category.default.${cat.name}`, { defaultValue: cat.name }) : cat.name}
              </option>
            ))}
          </select>
          {categoryError && (
            <p className="todo-form__error" role="alert">{categoryError}</p>
          )}
        </div>

        <Input
          label={t('todoForm.dueDate.label')}
          name="dueDate"
          type="date"
          value={form.dueDate}
          onChange={handleChange}
          hint={t('todoForm.dueDate.hint')}
          lang={i18n.language}
        />

        <div className="todo-form__actions">
          <Button type="submit" variant="primary" loading={isLoading}>
            {isEditMode ? t('todoForm.submit.edit') : t('todoForm.submit.add')}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('todoForm.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
