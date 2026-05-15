import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import './Input.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, required, className, ...props }: InputProps) {
  const { t } = useTranslation()
  const id = useId()
  const inputId = `${id}-input`
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = error ? errorId : hint ? hintId : undefined

  const inputCls = [
    'input-field',
    error ? 'input-field--error' : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <div className="input-wrapper">
      <label className="input-label" htmlFor={inputId}>
        {label}
        {required && <span className="input-required" aria-hidden="true"> *</span>}
        {required && <span className="sr-only">{t('input.required')}</span>}
      </label>
      <input
        {...props}
        id={inputId}
        required={required}
        className={inputCls}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        aria-required={required ? 'true' : undefined}
      />
      {hint && !error && (
        <p id={hintId} className="input-hint">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="input-error" role="alert">{error}</p>
      )}
    </div>
  )
}
