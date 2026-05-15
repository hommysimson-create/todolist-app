import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Header } from '../components/layout/Header'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../config/queryClient', () => ({
  queryClient: { clear: vi.fn() },
}))

vi.mock('../hooks/users/useUpdateMe', () => ({
  useUpdateMe: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}))

const mockUser = {
  id: 'u-1',
  email: 'test@example.com',
  name: '테스트',
  theme: 'light',
  createdAt: '',
  updatedAt: '',
}

function renderHeader() {
  return render(
    <MemoryRouter initialEntries={['/todos']}>
      <Header />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.getState().setAuth('token', mockUser)
})

describe('Header', () => {
  describe('렌더링', () => {
    it('TodoListApp 로고가 렌더링된다', () => {
      renderHeader()
      expect(screen.getByText('TodoListApp')).toBeInTheDocument()
    })

    it('할일목록 링크가 렌더링된다', () => {
      renderHeader()
      expect(screen.getByRole('link', { name: '할일목록' })).toBeInTheDocument()
    })

    it('카테고리 링크가 렌더링된다', () => {
      renderHeader()
      expect(screen.getByRole('link', { name: '카테고리' })).toBeInTheDocument()
    })

    it('내정보 링크가 렌더링된다', () => {
      renderHeader()
      expect(screen.getByRole('link', { name: '내정보' })).toBeInTheDocument()
    })

    it('로그아웃 버튼이 렌더링된다', () => {
      renderHeader()
      expect(screen.getAllByRole('button', { name: '로그아웃' })[0]).toBeInTheDocument()
    })

    it('햄버거 메뉴 버튼이 렌더링된다', () => {
      renderHeader()
      expect(screen.getByRole('button', { name: '메뉴 열기' })).toBeInTheDocument()
    })

    it('테마 전환 버튼이 렌더링된다', () => {
      renderHeader()
      expect(screen.getByRole('button', { name: /테마를 .* 모드로 변경/ })).toBeInTheDocument()
    })
  })

  describe('로그아웃', () => {
    it('로그아웃 클릭 시 clearAuth가 호출된다', async () => {
      const user = userEvent.setup()
      renderHeader()
      const [logoutBtn] = screen.getAllByRole('button', { name: '로그아웃' })
      await user.click(logoutBtn)
      expect(useAuthStore.getState().accessToken).toBeNull()
    })

    it('로그아웃 클릭 시 /login으로 navigate한다', async () => {
      const user = userEvent.setup()
      renderHeader()
      const [logoutBtn] = screen.getAllByRole('button', { name: '로그아웃' })
      await user.click(logoutBtn)
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  describe('모바일 메뉴', () => {
    it('햄버거 버튼 클릭 시 드로어가 열린다', async () => {
      const user = userEvent.setup()
      renderHeader()
      expect(screen.queryByRole('navigation', { name: '모바일 메뉴' })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: '메뉴 열기' }))
      expect(screen.getByRole('navigation', { name: '모바일 메뉴' })).toBeInTheDocument()
    })

    it('드로어의 로그아웃 버튼 클릭 시 /login으로 navigate한다', async () => {
      const user = userEvent.setup()
      renderHeader()
      await user.click(screen.getByRole('button', { name: '메뉴 열기' }))
      const logoutBtns = screen.getAllByRole('button', { name: '로그아웃' })
      await user.click(logoutBtns[logoutBtns.length - 1])
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('드로어의 테마 변경 버튼 클릭 시 테마가 전환된다', async () => {
      const user = userEvent.setup()
      renderHeader()
      await user.click(screen.getByRole('button', { name: '메뉴 열기' }))
      const themeBtn = screen.getByRole('button', { name: /테마 변경/ })
      const initialText = themeBtn.textContent
      await user.click(themeBtn)
      expect(themeBtn.textContent).not.toBe(initialText)
    })
  })

  describe('네비게이션 링크', () => {
    it('로고가 /todos로 연결된다', () => {
      renderHeader()
      expect(screen.getByRole('link', { name: '홈으로' })).toHaveAttribute('href', '/todos')
    })

    it('할일목록이 /todos로 연결된다', () => {
      renderHeader()
      expect(screen.getByRole('link', { name: '할일목록' })).toHaveAttribute('href', '/todos')
    })

    it('카테고리가 /categories로 연결된다', () => {
      renderHeader()
      expect(screen.getByRole('link', { name: '카테고리' })).toHaveAttribute('href', '/categories')
    })

    it('내정보가 /profile로 연결된다', () => {
      renderHeader()
      expect(screen.getByRole('link', { name: '내정보' })).toHaveAttribute('href', '/profile')
    })
  })
})
