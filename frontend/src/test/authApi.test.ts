import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosResponse } from 'axios'

vi.mock('../api/client', () => ({
  default: {
    post: vi.fn(),
  },
}))

import client from '../api/client'
import { register, login } from '../api/authApi'
import type { AuthResponse } from '../types/auth.types'

const mockResponse: AuthResponse = {
  accessToken: 'test-token',
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: '테스트',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
}

const mockedClient = vi.mocked(client)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authApi', () => {
  describe('register()', () => {
    it('POST /api/auth/register를 호출한다', async () => {
      ;(mockedClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockResponse,
      } as AxiosResponse)

      const input = { email: 'test@example.com', password: 'pass1234', name: '테스트' }
      const result = await register(input)

      expect(mockedClient.post).toHaveBeenCalledWith('/api/auth/register', input)
      expect(result).toEqual(mockResponse)
    })

    it('응답 data를 반환한다', async () => {
      ;(mockedClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockResponse,
      } as AxiosResponse)

      const result = await register({ email: 'a@b.com', password: 'pass1234', name: '홍길동' })
      expect(result.accessToken).toBe('test-token')
      expect(result.user.email).toBe('test@example.com')
    })

    it('에러를 그대로 전파한다', async () => {
      const error = { response: { status: 409, data: { message: '이미 사용 중인 이메일입니다.' } } }
      ;(mockedClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error)

      await expect(register({ email: 'a@b.com', password: 'pass1234', name: '홍길동' }))
        .rejects.toEqual(error)
    })
  })

  describe('login()', () => {
    it('POST /api/auth/login을 호출한다', async () => {
      ;(mockedClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockResponse,
      } as AxiosResponse)

      const input = { email: 'test@example.com', password: 'pass1234' }
      const result = await login(input)

      expect(mockedClient.post).toHaveBeenCalledWith('/api/auth/login', input)
      expect(result).toEqual(mockResponse)
    })

    it('응답 data를 반환한다', async () => {
      ;(mockedClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockResponse,
      } as AxiosResponse)

      const result = await login({ email: 'test@example.com', password: 'pass1234' })
      expect(result.user.name).toBe('테스트')
    })

    it('401 에러를 그대로 전파한다', async () => {
      const error = { response: { status: 401, data: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' } } }
      ;(mockedClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error)

      await expect(login({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toEqual(error)
    })
  })
})
