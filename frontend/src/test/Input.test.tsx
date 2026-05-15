import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../components/common/Input'

describe('Input', () => {
  it('label을 렌더링한다', () => {
    render(<Input label="이메일" />)
    expect(screen.getByText('이메일')).toBeInTheDocument()
  })

  it('label과 input이 연결된다', () => {
    render(<Input label="이메일" />)
    expect(screen.getByLabelText(/이메일/)).toBeInTheDocument()
  })

  it('required 시 * 표시가 렌더링된다', () => {
    render(<Input label="이메일" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('error 메시지가 렌더링된다', () => {
    render(<Input label="이메일" error="유효한 이메일을 입력하세요" />)
    expect(screen.getByText('유효한 이메일을 입력하세요')).toBeInTheDocument()
  })

  it('error 시 aria-invalid가 true이다', () => {
    render(<Input label="이메일" error="오류" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('error 없을 때 aria-invalid가 없다', () => {
    render(<Input label="이메일" />)
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid')
  })

  it('error 시 input에 error 클래스가 추가된다', () => {
    render(<Input label="이메일" error="오류" />)
    expect(screen.getByRole('textbox')).toHaveClass('input-field--error')
  })

  it('hint 텍스트를 렌더링한다', () => {
    render(<Input label="이메일" hint="유효한 이메일 주소를 입력하세요" />)
    expect(screen.getByText('유효한 이메일 주소를 입력하세요')).toBeInTheDocument()
  })

  it('error가 있을 때 hint가 렌더링되지 않는다', () => {
    render(<Input label="이메일" error="오류" hint="힌트" />)
    expect(screen.queryByText('힌트')).not.toBeInTheDocument()
  })

  it('onChange가 호출된다', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Input label="이메일" onChange={onChange} />)
    await user.type(screen.getByRole('textbox'), 'a')
    expect(onChange).toHaveBeenCalled()
  })

  it('type prop을 전달한다', () => {
    render(<Input label="비밀번호" type="password" />)
    const input = document.querySelector('input[type="password"]')
    expect(input).toBeInTheDocument()
  })

  it('placeholder를 렌더링한다', () => {
    render(<Input label="이메일" placeholder="user@example.com" />)
    expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument()
  })
})
