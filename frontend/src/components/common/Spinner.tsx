import { useTranslation } from 'react-i18next'
import './Spinner.css'

interface SpinnerProps {
  label?: string
  size?: number
}

export function Spinner({ label, size }: SpinnerProps) {
  const { t } = useTranslation()
  const resolvedLabel = label ?? t('loading')
  return (
    <span
      className="spinner"
      role="status"
      aria-label={resolvedLabel}
      style={size !== undefined ? { width: size, height: size } : undefined}
    />
  )
}
