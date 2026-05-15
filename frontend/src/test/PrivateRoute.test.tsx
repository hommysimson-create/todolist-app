import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { PrivateRoute } from '../components/layout/PrivateRoute'
import { vi } from 'vitest'

vi.mock('../components/layout/Header', () => ({
  Header: () => <div data-testid="mock-header" />,
}))

const mockUser = {
  id: 'u-1',
  email: 'test@example.com',
  name: '테스트',
  theme: 'light',
  createdAt: '',
  updatedAt: '',
}

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>로그인 페이지</div>} />
        <Route element={<PrivateRoute />}>
          <Route path="/todos" element={<div>할일 페이지</div>} />
          <Route path="/categories" element={<div>카테고리 페이지</div>} />
          <Route path="/profile" element={<div>프로필 페이지</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  useAuthStore.getState().clearAuth()
})

describe('PrivateRoute', () => {
  it('인증된 사용자는 /todos에 접근할 수 있다', () => {
    useAuthStore.getState().setAuth('token', mockUser)
    renderWithRouter('/todos')
    expect(screen.getByText('할일 페이지')).toBeInTheDocument()
  })

  it('인증된 사용자는 /categories에 접근할 수 있다', () => {
    useAuthStore.getState().setAuth('token', mockUser)
    renderWithRouter('/categories')
    expect(screen.getByText('카테고리 페이지')).toBeInTheDocument()
  })

  it('인증된 사용자는 /profile에 접근할 수 있다', () => {
    useAuthStore.getState().setAuth('token', mockUser)
    renderWithRouter('/profile')
    expect(screen.getByText('프로필 페이지')).toBeInTheDocument()
  })

  it('미인증 상태에서 /todos 접근 시 /login으로 리다이렉트된다', () => {
    renderWithRouter('/todos')
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument()
    expect(screen.queryByText('할일 페이지')).not.toBeInTheDocument()
  })

  it('미인증 상태에서 /categories 접근 시 /login으로 리다이렉트된다', () => {
    renderWithRouter('/categories')
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument()
  })

  it('미인증 상태에서 /profile 접근 시 /login으로 리다이렉트된다', () => {
    renderWithRouter('/profile')
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument()
  })

  it('로그아웃 후 보호된 경로에 접근하면 /login으로 리다이렉트된다', () => {
    useAuthStore.getState().setAuth('token', mockUser)
    useAuthStore.getState().clearAuth()
    renderWithRouter('/todos')
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument()
  })
})
