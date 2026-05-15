import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './CategoryPage.css'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Spinner } from '../../components/common/Spinner'
import { ErrorMessage } from '../../components/common/ErrorMessage'
import { useCategories } from '../../hooks/categories/useCategories'
import { useCreateCategory } from '../../hooks/categories/useCreateCategory'
import { useDeleteCategory } from '../../hooks/categories/useDeleteCategory'
import { getErrorMessage } from '../../utils/getErrorMessage'

export function CategoryPage() {
  const { t } = useTranslation()
  const [newName, setNewName] = useState('')
  const [nameError, setNameError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const { data: categories = [], isLoading, isError } = useCategories()
  const createCategory = useCreateCategory()
  const deleteCategory = useDeleteCategory()

  const defaultCategories = categories.filter((c) => c.isDefault)
  const customCategories = categories.filter((c) => !c.isDefault)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) {
      setNameError(t('categories.name.required'))
      return
    }
    setNameError('')
    createCategory.mutate(
      { name: newName.trim() },
      {
        onSuccess: () => setNewName(''),
        onError: (error) => setNameError(getErrorMessage(error)),
      }
    )
  }

  function handleDelete(id: string) {
    setDeleteError('')
    deleteCategory.mutate(id, {
      onError: (error) => setDeleteError(getErrorMessage(error)),
    })
  }

  return (
    <div className="category-page">
      <h1 className="category-page__title">{t('categories.title')}</h1>

      <section className="category-page__add">
        <h2 className="category-page__add-title">{t('categories.add.title')}</h2>
        <form className="category-page__add-form" onSubmit={handleAdd} noValidate>
          <div className="category-page__add-input">
            <Input
              label={t('categories.name.label')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              error={nameError}
              placeholder={t('categories.name.placeholder')}
              maxLength={100}
            />
          </div>
          <Button type="submit" variant="primary" loading={createCategory.isPending}>
            {t('categories.add.submit')}
          </Button>
        </form>
      </section>

      {isLoading && <Spinner label={t('categories.loading')} />}
      {isError && <ErrorMessage message={t('categories.loadError')} />}

      {!isLoading && !isError && (
        <>
          <section className="category-page__section" aria-label={t('categories.default.section')}>
            <h2 className="category-page__section-title">{t('categories.default.section')}</h2>
            <ul className="category-page__list" aria-label={t('categories.default.section')}>
              {defaultCategories.map((cat) => (
                <li key={cat.id} className="category-page__item">
                  <div className="category-page__item-info">
                    <span className="category-page__badge">{t('categories.default')}</span>
                    <span className="category-page__name">{t(`category.default.${cat.name}`, { defaultValue: cat.name })}</span>
                  </div>
                  <Button variant="danger" disabled>{t('categories.delete')}</Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="category-page__section" aria-label={t('categories.custom.section')}>
            <h2 className="category-page__section-title">{t('categories.custom.section')}</h2>
            {customCategories.length === 0 ? (
              <p className="category-page__empty">{t('categories.custom.empty')}</p>
            ) : (
              <ul className="category-page__list" aria-label={t('categories.custom.section')}>
                {customCategories.map((cat) => (
                  <li key={cat.id} className="category-page__item">
                    <span className="category-page__name">{cat.name}</span>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(cat.id)}
                      loading={deleteCategory.isPending}
                    >
                      {t('categories.delete')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {deleteError && <ErrorMessage message={deleteError} />}
    </div>
  )
}
