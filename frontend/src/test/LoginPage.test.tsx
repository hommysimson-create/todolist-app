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

vi.mock('../hooks/auth/useLogin', () => ({
  useLogin: vi.fn(),
}))

import { useLogin } from '../hooks/auth/useLogin'
import { LoginPage } from '../pages/auth/LoginPage'

const mockedUseLogin = vi.mocked(useLogin)

function makeHookResult(overrides: Partial<ReturnType<typeof useLogin>> = {}) {
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
  mockedUseLogin.mockReturnValue(makeHookResult() as ReturnType<typeof useLogin>)
})

describe('LoginPage', () => {
  describe('렌더링', () => {
    it('이메일 Input이 렌더링된다', () => {
      render(<LoginPage />)
      expect(screen.getByLabelText(/이메일/)).toBeInTheDocument()
    })

    it('비밀번호 Input이 렌더링된다', () => {
      render(<LoginPage />)
      expect(screen.getByLabelText(/비밀번호/)).toBeInTheDocument()
    })

    it('로그인 버튼이 렌더링된다', () => {
      render(<LoginPage />)
      expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
    })

    it('가입하기 링크가 렌더링된다', () => {
      render(<LoginPage />)
      expect(screen.getByRole('link', { name: '가입하기' })).toBeInTheDocument()
    })

    it('가입하기 링크가 /register로 연결된다', () => {
      render(<LoginPage />)
      expect(screen.getByRole('link', { name: '가입하기' })).toHaveAttribute('href', '/register')
    })

    it('초기 에러 메시지가 없다', () => {
      render(<LoginPage />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('로컬 유효성 검사', () => {
    it('이메일을 입력하지 않으면 에러 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      await user.click(screen.getByRole('button', { name: '로그인' }))
      expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument()
    })

    it('잘못된 이메일 형식이면 에러 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      await user.type(screen.getByLabelText(/이메일/), 'not-an-email')
      await user.click(screen.getByRole('button', { name: '로그인' }))
      expect(screen.getByText('유효한 이메일 주소를 입력하세요.')).toBeInTheDocument()
    })

    it('비밀번호를 입력하지 않으면 에러 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
      await user.click(screen.getByRole('button', { name: '로그인' }))
      expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument()
    })

    it('유효성 검사 실패 시 login이 호출되지 않는다', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      await user.click(screen.getByRole('button', { name: '로그인' }))
      expect(mockMutate).not.toHaveBeenCalled()
    })
  })

  describe('폼 제출', () => {
    it('유효한 입력으로 login이 호출된다', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
      await user.type(screen.getByLabelText(/비밀번호/), 'password123')
      await user.click(screen.getByRole('button', { name: '로그인' }))
      expect(mockMutate).toHaveBeenCalledWith(
        { email: 'test@example.com', password: 'password123' },
        expect.objectContaining({ onError: expect.any(Function) })
      )
    })

    it('로딩 중에 버튼이 비활성화된다', () => {
      mockedUseLogin.mockReturnValue(makeHookResult({ isPending: true }) as ReturnType<typeof useLogin>)
      render(<LoginPage />)
      expect(screen.getByRole('button', { name: /로그인/ })).toBeDisabled()
    })

    it('401 에러 시 "이메일 또는 비밀번호가 올바르지 않습니다" 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      const serverError = {
        isAxiosError: true,
        response: { status: 401, data: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' } },
      }
      mockMutate.mockImplementation((_data, options) => {
        options.onError(serverError)
      })
      render(<LoginPage />)
      await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
      await user.type(screen.getByLabelText(/비밀번호/), 'wrongpass')
      await user.click(screen.getByRole('button', { name: '로그인' }))
      await waitFor(() => {
        expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument()
      })
    })

    it('서버 에러는 role=alert로 렌더링된다', async () => {
      const user = userEvent.setup()
      const serverError = {
        isAxiosError: true,
        response: { status: 401, data: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' } },
      }
      mockMutate.mockImplementation((_data, options) => {
        options.onError(serverError)
      })
      render(<LoginPage />)
      await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
      await user.type(screen.getByLabelText(/비밀번호/), 'wrongpass')
      await user.click(screen.getByRole('button', { name: '로그인' }))
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})
