import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosResponse } from 'axios'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import client from '../api/client'
import { getMe, updateMe, deleteMe } from '../api/userApi'
import type { User } from '../types/auth.types'

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: '김민준',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const mockedClient = vi.mocked(client)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('userApi', () => {
  describe('getMe()', () => {
    it('GET /api/users/me를 호출한다', async () => {
      ;(mockedClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockUser,
      } as AxiosResponse)

      const result = await getMe()
      expect(mockedClient.get).toHaveBeenCalledWith('/api/users/me')
      expect(result).toEqual(mockUser)
    })

    it('User 객체를 반환한다', async () => {
      ;(mockedClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockUser,
      } as AxiosResponse)

      const result = await getMe()
      expect(result.email).toBe('test@example.com')
      expect(result.name).toBe('김민준')
    })

    it('401 에러를 전파한다', async () => {
      const error = { response: { status: 401, data: { message: '인증이 필요합니다.' } } }
      ;(mockedClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error)

      await expect(getMe()).rejects.toEqual(error)
    })
  })

  describe('updateMe()', () => {
    it('PATCH /api/users/me를 호출한다', async () => {
      const updatedUser = { ...mockUser, name: '이수진' }
      ;(mockedClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: updatedUser,
      } as AxiosResponse)

      const result = await updateMe({ name: '이수진' })
      expect(mockedClient.patch).toHaveBeenCalledWith('/api/users/me', { name: '이수진' })
      expect(result.name).toBe('이수진')
    })

    it('비밀번호만 변경할 수 있다', async () => {
      ;(mockedClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockUser,
      } as AxiosResponse)

      await updateMe({ password: 'newPass123!' })
      expect(mockedClient.patch).toHaveBeenCalledWith('/api/users/me', { password: 'newPass123!' })
    })

    it('400 에러를 전파한다', async () => {
      const error = { response: { status: 400, data: { message: '비밀번호는 최소 8자 이상이어야 합니다.' } } }
      ;(mockedClient.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error)

      await expect(updateMe({ password: '1234' })).rejects.toEqual(error)
    })
  })

  describe('deleteMe()', () => {
    it('DELETE /api/users/me를 호출한다', async () => {
      ;(mockedClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: undefined })

      await deleteMe()
      expect(mockedClient.delete).toHaveBeenCalledWith('/api/users/me')
    })

    it('에러를 전파한다', async () => {
      const error = { response: { status: 401, data: { message: '인증이 필요합니다.' } } }
      ;(mockedClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error)

      await expect(deleteMe()).rejects.toEqual(error)
    })
  })
})
