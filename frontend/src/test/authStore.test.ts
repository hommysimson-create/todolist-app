import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../stores/authStore'

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: '테스트',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('초기 상태는 null이다', () => {
    const { accessToken, user } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(user).toBeNull()
  })

  it('setAuth로 token과 user를 저장한다', () => {
    useAuthStore.getState().setAuth('test-token', mockUser)
    expect(useAuthStore.getState().accessToken).toBe('test-token')
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('토큰이 없으면 isAuthenticated는 false다', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false)
  })

  it('토큰이 있으면 isAuthenticated는 true다', () => {
    useAuthStore.getState().setAuth('test-token', mockUser)
    expect(useAuthStore.getState().isAuthenticated()).toBe(true)
  })

  it('clearAuth 후 상태가 초기화된다', () => {
    useAuthStore.getState().setAuth('test-token', mockUser)
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('localStorage를 사용하지 않는다', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
    useAuthStore.getState().setAuth('test-token', mockUser)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
