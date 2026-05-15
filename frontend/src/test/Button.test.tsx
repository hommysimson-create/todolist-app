import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../components/common/Button'

describe('Button', () => {
  it('children 텍스트를 렌더링한다', () => {
    render(<Button>저장</Button>)
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('기본 variant는 primary이다', () => {
    render(<Button>저장</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn--primary')
  })

  it('secondary variant를 렌더링한다', () => {
    render(<Button variant="secondary">취소</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn--secondary')
  })

  it('danger variant를 렌더링한다', () => {
    render(<Button variant="danger">삭제</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn--danger')
  })

  it('onClick 핸들러를 호출한다', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>저장</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disabled 상태에서 버튼이 비활성화된다', () => {
    render(<Button disabled>저장</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('disabled 상태에서 onClick이 호출되지 않는다', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>저장</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('loading 상태에서 aria-busy가 true이다', () => {
    render(<Button loading>저장</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })

  it('loading 상태에서 버튼이 비활성화된다', () => {
    render(<Button loading>저장</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('loading 상태에서 spinner가 렌더링된다', () => {
    render(<Button loading>저장</Button>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('loading 상태에서 onClick이 호출되지 않는다', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>저장</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('type prop을 전달한다', () => {
    render(<Button type="submit">제출</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
