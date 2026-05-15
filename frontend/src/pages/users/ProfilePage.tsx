import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMe } from '../../hooks/users/useMe'
import { useUpdateMe } from '../../hooks/users/useUpdateMe'
import { useDeleteMe } from '../../hooks/users/useDeleteMe'
import { useThemeStore, type Theme } from '../../stores/themeStore'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { ErrorMessage } from '../../components/common/ErrorMessage'
import { Spinner } from '../../components/common/Spinner'
import './ProfilePage.css'

export function ProfilePage() {
  const { t } = useTranslation()
  const { data: user, isLoading, isError, error: fetchError } = useMe()
  const { mutate: updateMe, isPending: isUpdating, error: updateError } = useUpdateMe()
  const { mutate: deleteMe, isPending: isDeleting } = useDeleteMe()
  const { setTheme } = useThemeStore()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [theme, setProfileTheme] = useState<Theme>('light')
  const [localError, setLocalError] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      if (user.theme) {
        setProfileTheme(user.theme)
      }
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="profile-page-loading">
        <Spinner size={40} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="profile-page-error container">
        <ErrorMessage message={fetchError instanceof Error ? fetchError.message : t('profile.loadError')} />
      </div>
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (password && password.length < 8) {
      setLocalError(t('profile.password.minLength'))
      return
    }

    const updateData: { name?: string; password?: string; theme?: Theme } = {}
    if (name !== user?.name) updateData.name = name
    if (password) updateData.password = password
    if (theme !== user?.theme) updateData.theme = theme

    if (Object.keys(updateData).length === 0) return

    updateMe(updateData, {
      onSuccess: () => {
        setPassword('')
        if (updateData.theme) {
          setTheme(updateData.theme)
        }
      }
    })
  }

  const handleDelete = () => {
    deleteMe(undefined, {
      onSuccess: () => {
        setIsDeleteModalOpen(false)
      }
    })
  }

  return (
    <div className="profile-page container">
      <h1 className="profile-page__title">{t('profile.title')}</h1>
      
      <form onSubmit={handleSave} className="profile-form">
        <Input
          label={t('profile.email.label')}
          value={user?.email || ''}
          readOnly
          disabled
        />
        
        <Input
          label={t('profile.name.label')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('profile.name.placeholder')}
          required
        />
        
        <Input
          label={t('profile.password.label')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('profile.password.placeholder')}
          error={localError || undefined}
        />

        <div className="profile-form__field">
          <label className="profile-form__label">{t('profile.theme.label')}</label>
          <div className="profile-form__radio-group">
            <label className="profile-form__radio-label">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={() => setProfileTheme('light')}
              />
              {t('profile.theme.light')}
            </label>
            <label className="profile-form__radio-label">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => setProfileTheme('dark')}
              />
              {t('profile.theme.dark')}
            </label>
          </div>
        </div>

        {updateError && (
          <ErrorMessage message={updateError instanceof Error ? updateError.message : t('profile.updateError')} />
        )}

        <div className="profile-form__actions">
          <Button type="submit" loading={isUpdating}>
            {t('profile.save')}
          </Button>
        </div>
      </form>

      <hr className="profile-divider" />

      <div className="danger-zone">
        <h2 className="danger-zone__title">{t('profile.dangerZone')}</h2>
        <p className="danger-zone__description">
          {t('profile.dangerZone.desc')}
        </p>
        <Button 
          variant="danger" 
          onClick={() => setIsDeleteModalOpen(true)}
        >
          {t('profile.deleteAccount')}
        </Button>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('profile.deleteConfirm.title')}
      >
        <div className="delete-confirm">
          <p className="delete-confirm__message">
            {t('profile.deleteConfirm.message')}
          </p>
          <div className="delete-confirm__actions">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              {t('profile.deleteConfirm.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
              {t('profile.deleteConfirm.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
