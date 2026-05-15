import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorMessage } from '../components/common/ErrorMessage'

describe('ErrorMessage', () => {
  it('메시지를 렌더링한다', () => {
    render(<ErrorMessage message="오류가 발생했습니다" />)
    expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument()
  })

  it('role="alert"이다', () => {
    render(<ErrorMessage message="오류" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('⚠ 아이콘이 렌더링된다', () => {
    const { container } = render(<ErrorMessage message="오류" />)
    const icon = container.querySelector('.error-message__icon')
    expect(icon).toBeInTheDocument()
  })

  it('아이콘에 aria-hidden이 true이다', () => {
    const { container } = render(<ErrorMessage message="오류" />)
    const icon = container.querySelector('.error-message__icon')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('className prop이 병합된다', () => {
    const { container } = render(<ErrorMessage message="오류" className="custom-class" />)
    expect(container.firstChild).toHaveClass('error-message', 'custom-class')
  })
})
