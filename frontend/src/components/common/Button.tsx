import './Button.css'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className,
  onClick,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  const cls = [
    'btn',
    `btn--${variant}`,
    loading ? 'btn--loading' : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <button
      {...props}
      className={cls}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      onClick={isDisabled ? undefined : onClick}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
}
