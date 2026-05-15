import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfilePage } from '../pages/users/ProfilePage'
import { useMe } from '../hooks/users/useMe'
import { useUpdateMe } from '../hooks/users/useUpdateMe'
import { useDeleteMe } from '../hooks/users/useDeleteMe'

vi.mock('../hooks/users/useMe')
vi.mock('../hooks/users/useUpdateMe')
vi.mock('../hooks/users/useDeleteMe')

const mockedUseMe = vi.mocked(useMe)
const mockedUseUpdateMe = vi.mocked(useUpdateMe)
const mockedUseDeleteMe = vi.mocked(useDeleteMe)

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: '테스트 유저',
  theme: 'light' as Theme,
}

function makeMutationResult(mutate: any, overrides = {}) {
  return {
    mutate,
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseMe.mockReturnValue({
    data: mockUser,
    isLoading: false,
    isError: false,
    error: null,
  } as any)
  mockedUseUpdateMe.mockReturnValue(makeMutationResult(vi.fn()) as any)
  mockedUseDeleteMe.mockReturnValue(makeMutationResult(vi.fn()) as any)
})

describe('ProfilePage', () => {
  it('사용자 정보를 렌더링한다', () => {
    render(<ProfilePage />)
    expect(screen.getByLabelText(/이메일/)).toHaveValue(mockUser.email)
    expect(screen.getByLabelText(/이름/)).toHaveValue(mockUser.name)
    expect(screen.getByLabelText(/라이트 모드/)).toBeChecked()
  })

  it('이메일 필드는 읽기 전용이어야 한다', () => {
    render(<ProfilePage />)
    expect(screen.getByLabelText(/이메일/)).toHaveAttribute('readonly')
  })

  it('이름을 수정하고 저장하면 useUpdateMe가 호출된다', async () => {
    const mutate = vi.fn()
    mockedUseUpdateMe.mockReturnValue(makeMutationResult(mutate) as any)
    const user = userEvent.setup()
    render(<ProfilePage />)

    const nameInput = screen.getByLabelText(/이름/)
    await user.clear(nameInput)
    await user.type(nameInput, '수정된 이름')

    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(mutate).toHaveBeenCalledWith({ name: '수정된 이름' }, expect.any(Object))
  })

  it('비밀번호가 8자 미만이면 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    const passwordInput = screen.getByLabelText(/새 비밀번호/)
    await user.type(passwordInput, '1234567')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(screen.getByText('비밀번호는 최소 8자 이상이어야 합니다.')).toBeInTheDocument()
  })

  it('비밀번호를 입력하고 저장하면 useUpdateMe가 호출된다', async () => {
    const mutate = vi.fn()
    mockedUseUpdateMe.mockReturnValue(makeMutationResult(mutate) as any)
    const user = userEvent.setup()
    render(<ProfilePage />)

    const passwordInput = screen.getByLabelText(/새 비밀번호/)
    await user.type(passwordInput, 'newpassword123')

    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(mutate).toHaveBeenCalledWith({ password: 'newpassword123' }, expect.any(Object))
  })

  it('테마를 변경하고 저장하면 useUpdateMe가 호출된다', async () => {
    const mutate = vi.fn()
    mockedUseUpdateMe.mockReturnValue(makeMutationResult(mutate) as any)
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByLabelText(/다크 모드/))
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(mutate).toHaveBeenCalledWith({ theme: 'dark' }, expect.any(Object))
  })

  it('회원 탈퇴 버튼을 누르면 확인 모달이 뜬다', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }))

    expect(screen.getByText(/정말 탈퇴하시겠습니까/)).toBeInTheDocument()
  })

  it('탈퇴 확인을 누르면 useDeleteMe가 호출된다', async () => {
    const deleteMutate = vi.fn()
    mockedUseDeleteMe.mockReturnValue(makeMutationResult(deleteMutate) as any)
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }))
    await user.click(screen.getByRole('button', { name: '탈퇴하기' }))

    expect(deleteMutate).toHaveBeenCalled()
  })
})
