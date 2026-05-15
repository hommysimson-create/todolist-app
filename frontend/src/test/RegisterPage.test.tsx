import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

const mockNavigate = vi.fn()
const mockMutate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

vi.mock('../hooks/auth/useRegister', () => ({
  useRegister: vi.fn(),
}))

import { useRegister } from '../hooks/auth/useRegister'
import { RegisterPage } from '../pages/auth/RegisterPage'

const mockedUseRegister = vi.mocked(useRegister)

function makeHookResult(overrides: Partial<ReturnType<typeof useRegister>> = {}) {
  return {
    mutate: mockMutate,
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isIdle: true,
    isPaused: false,
    status: 'idle' as const,
    submittedAt: 0,
    variables: undefined,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseRegister.mockReturnValue(makeHookResult() as ReturnType<typeof useRegister>)
})

describe('RegisterPage', () => {
  describe('렌더링', () => {
    it('이메일 Input이 렌더링된다', () => {
      render(<RegisterPage />)
      expect(screen.getByLabelText(/이메일/)).toBeInTheDocument()
    })

    it('비밀번호 Input이 렌더링된다', () => {
      render(<RegisterPage />)
      expect(screen.getByLabelText(/비밀번호/)).toBeInTheDocument()
    })

    it('이름 Input이 렌더링된다', () => {
      render(<RegisterPage />)
      expect(screen.getByLabelText(/이름/)).toBeInTheDocument()
    })

    it('가입하기 버튼이 렌더링된다', () => {
      render(<RegisterPage />)
      expect(screen.getByRole('button', { name: '가입하기' })).toBeInTheDocument()
    })

    it('로그인 링크가 렌더링된다', () => {
      render(<RegisterPage />)
      expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument()
    })

    it('로그인 링크가 /login으로 연결된다', () => {
      render(<RegisterPage />)
      expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login')
    })
  })

  describe('로컬 유효성 검사', () => {
    it('이메일을 입력하지 않으면 에러 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)
      await user.click(screen.getByRole('button', { name: '가입하기' }))
      expect(screen.getByText(/이메일을 입력/)).toBeInTheDocument()
    })

    it('잘못된 이메일 형식이면 에러 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)
      await user.type(screen.getByLabelText(/이메일/), 'invalid-email')
      await user.click(screen.getByRole('button', { name: '가입하기' }))
      expect(screen.getByText(/유효한 이메일/)).toBeInTheDocument()
    })

    it('비밀번호를 입력하지 않으면 에러 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)
      await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
      await user.click(screen.getByRole('button', { name: '가입하기' }))
      expect(screen.getByText(/비밀번호를 입력/)).toBeInTheDocument()
    })

    it('비밀번호가 8자 미만이면 에러 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)
      await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
      await user.type(screen.getByLabelText(/비밀번호/), 'short')
      await user.click(screen.getByRole('button', { name: '가입하기' }))
      expect(screen.getByText('비밀번호는 최소 8자 이상이어야 합니다.')).toBeInTheDocument()
    })

    it('이름을 입력하지 않으면 에러 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)
      await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
      await user.type(screen.getByLabelText(/비밀번호/), 'password123')
      await user.click(screen.getByRole('button', { name: '가입하기' }))
      expect(screen.getByText(/이름을 입력/)).toBeInTheDocument()
    })

    it('유효성 검사 실패 시 register가 호출되지 않는다', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)
      await user.click(screen.getByRole('button', { name: '가입하기' }))
      expect(mockMutate).not.toHaveBeenCalled()
    })
  })

  describe('폼 제출', () => {
    it('모든 필드가 유효하면 register가 호출된다', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)
      await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
      await user.type(screen.getByLabelText(/비밀번호/), 'password123')
      await user.type(screen.getByLabelText(/이름/), '김민준')
      await user.click(screen.getByRole('button', { name: '가입하기' }))
      expect(mockMutate).toHaveBeenCalledWith(
        { email: 'test@example.com', password: 'password123', name: '김민준' },
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
      )
    })

    it('로딩 중에 버튼이 비활성화된다', () => {
      mockedUseRegister.mockReturnValue(makeHookResult({ isPending: true }) as ReturnType<typeof useRegister>)
      render(<RegisterPage />)
      expect(screen.getByRole('button', { name: /가입하기/ })).toBeDisabled()
    })

    it('성공 시 /login으로 navigate한다', async () => {
      const user = userEvent.setup()
      mockMutate.mockImplementation((_data, options) => {
        options.onSuccess()
      })
      render(<RegisterPage />)
      await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
      await user.type(screen.getByLabelText(/비밀번호/), 'password123')
      await user.type(screen.getByLabelText(/이름/), '김민준')
      await user.click(screen.getByRole('button', { name: '가입하기' }))
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('409 에러 시 서버 에러 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      const serverError = {
        isAxiosError: true,
        response: { status: 409, data: { message: '이미 사용 중인 이메일입니다.' } },
      }
      mockMutate.mockImplementation((_data, options) => {
        options.onError(serverError)
      })
      render(<RegisterPage />)
      await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
      await user.type(screen.getByLabelText(/비밀번호/), 'password123')
      await user.type(screen.getByLabelText(/이름/), '김민준')
      await user.click(screen.getByRole('button', { name: '가입하기' }))
      await waitFor(() => {
        expect(screen.getByText('이미 사용 중인 이메일입니다.')).toBeInTheDocument()
      })
    })
  })
})
