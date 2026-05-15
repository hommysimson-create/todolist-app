import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from '../components/common/Spinner'

describe('Spinner', () => {
  it('렌더링된다', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('기본 aria-label이 "로딩 중"이다', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', '로딩 중')
  })

  it('커스텀 aria-label을 설정할 수 있다', () => {
    render(<Spinner label="데이터 로딩 중" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', '데이터 로딩 중')
  })

  it('spinner 클래스를 가진다', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toHaveClass('spinner')
  })
})
