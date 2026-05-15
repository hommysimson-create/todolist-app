import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '../components/common/Modal'

describe('Modal', () => {
  it('isOpen=false 시 렌더링되지 않는다', () => {
    render(<Modal isOpen={false} onClose={vi.fn()}>내용</Modal>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('isOpen=true 시 dialog가 렌더링된다', () => {
    render(<Modal isOpen onClose={vi.fn()}>내용</Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('aria-modal이 true이다', () => {
    render(<Modal isOpen onClose={vi.fn()}>내용</Modal>)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('title을 렌더링한다', () => {
    render(<Modal isOpen onClose={vi.fn()} title="모달 제목">내용</Modal>)
    expect(screen.getByText('모달 제목')).toBeInTheDocument()
  })

  it('children을 렌더링한다', () => {
    render(<Modal isOpen onClose={vi.fn()}>모달 내용입니다</Modal>)
    expect(screen.getByText('모달 내용입니다')).toBeInTheDocument()
  })

  it('닫기 버튼 클릭 시 onClose가 호출된다', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} title="제목">내용</Modal>)
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('overlay 클릭 시 onClose가 호출된다', () => {
    const onClose = vi.fn()
    const { container } = render(<Modal isOpen onClose={onClose}>내용</Modal>)
    const overlay = container.querySelector('.modal-overlay')
    if (overlay) fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('dialog 내부 클릭 시 onClose가 호출되지 않는다', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose}>내용</Modal>)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('ESC 키 입력 시 onClose가 호출된다', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose}>내용</Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('isOpen=false 이면 ESC 키에 반응하지 않는다', () => {
    const onClose = vi.fn()
    render(<Modal isOpen={false} onClose={onClose}>내용</Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
