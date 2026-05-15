import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof axios>('axios')
  const interceptors = {
    request: { use: vi.fn(), handlers: [] as any[] },
    response: { use: vi.fn(), handlers: [] as any[] },
  }

  const instance = {
    ...actual,
    interceptors,
    create: vi.fn(() => instance),
  }
  return { default: instance }
})

describe('api client', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
    vi.clearAllMocks()
  })

  it('client 모듈이 임포트된다', async () => {
    const mod = await import('../api/client')
    expect(mod.default).toBeDefined()
  })
})
