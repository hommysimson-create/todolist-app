import './ErrorMessage.css'

interface ErrorMessageProps {
  message: string
  className?: string
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  const cls = ['error-message', className].filter(Boolean).join(' ')
  return (
    <div className={cls} role="alert">
      <span className="error-message__icon" aria-hidden="true">⚠</span>
      <span className="error-message__text">{message}</span>
    </div>
  )
}
