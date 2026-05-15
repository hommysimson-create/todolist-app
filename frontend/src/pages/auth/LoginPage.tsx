import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { ErrorMessage } from '../../components/common/ErrorMessage'
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher'
import { useLogin } from '../../hooks/auth/useLogin'
import { getErrorMessage } from '../../utils/getErrorMessage'
import './AuthPage.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FieldErrors {
  email?: string
  password?: string
}

export function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')

  const { mutate: login, isPending } = useLogin()

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    if (!email) {
      next.email = t('login.email.required')
    } else if (!EMAIL_REGEX.test(email)) {
      next.email = t('login.email.invalid')
    }
    if (!password) {
      next.password = t('login.password.required')
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
    login(
      { email, password },
      {
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
        <h1 className="auth-brand">{t('login.brand')}</h1>
        <h2 className="auth-title">{t('login.title')}</h2>

        <form onSubmit={handleSubmit} noValidate>
          {serverError && (
            <ErrorMessage message={serverError} className="auth-server-error" />
          )}

          <Input
            label={t('login.email.label')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder={t('login.email.placeholder')}
            required
          />

          <Input
            label={t('login.password.label')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder={t('login.password.placeholder')}
            required
          />

          <Button type="submit" loading={isPending} className="auth-submit-btn">
            {t('login.submit')}
          </Button>
        </form>

        <p className="auth-footer-link">
          <Trans i18nKey="login.footer" components={{ Link: <Link to="/register" /> }} />
        </p>
      </div>
    </div>
  )
}
