import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { ErrorMessage } from '../../components/common/ErrorMessage'
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher'
import { useRegister } from '../../hooks/auth/useRegister'
import { getErrorMessage } from '../../utils/getErrorMessage'
import './AuthPage.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FieldErrors {
  email?: string
  password?: string
  name?: string
}

export function RegisterPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')

  const navigate = useNavigate()
  const { mutate: register, isPending } = useRegister()

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    if (!email) {
      next.email = t('register.email.required')
    } else if (!EMAIL_REGEX.test(email)) {
      next.email = t('register.email.invalid')
    }
    if (!password) {
      next.password = t('register.password.required')
    } else if (password.length < 8) {
      next.password = t('register.password.minLength')
    }
    if (!name) {
      next.name = t('register.name.required')
    }
    return next
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerError('')
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    register(
      { email, password, name },
      {
        onSuccess: () => navigate('/login'),
        onError: (err) => setServerError(getErrorMessage(err)),
      }
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-lang">
          <LanguageSwitcher />
        </div>
        <h1 className="auth-brand">{t('register.brand')}</h1>
        <h2 className="auth-title">{t('register.title')}</h2>

        <form onSubmit={handleSubmit} noValidate>
          {serverError && (
            <ErrorMessage message={serverError} className="auth-server-error" />
          )}

          <Input
            label={t('register.email.label')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            hint={t('register.email.invalid')}
            placeholder={t('register.email.placeholder')}
            required
          />

          <Input
            label={t('register.password.label')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint={t('register.password.hint')}
            placeholder={t('register.password.placeholder')}
            required
          />

          <Input
            label={t('register.name.label')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            hint={t('register.name.hint')}
            placeholder={t('register.name.placeholder')}
            required
          />

          <Button type="submit" loading={isPending} className="auth-submit-btn">
            {t('register.submit')}
          </Button>
        </form>

        <p className="auth-footer-link">
          <Trans i18nKey="register.footer" components={{ Link: <Link to="/login" /> }} />
        </p>
      </div>
    </div>
  )
}
