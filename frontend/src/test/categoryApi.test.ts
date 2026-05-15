import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosResponse } from 'axios'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

import client from '../api/client'
import { getCategories, createCategory, deleteCategory } from '../api/categoryApi'
import type { Category } from '../types/category.types'

const mockCategories: Category[] = [
  { id: 'cat-1', userId: null, name: '업무', isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-2', userId: 'user-1', name: '사이드프로젝트', isDefault: false, createdAt: '2026-01-01T00:00:00Z' },
]

const mockedClient = vi.mocked(client)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('categoryApi', () => {
  describe('getCategories()', () => {
    it('GET /api/categories를 호출한다', async () => {
      ;(mockedClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockCategories,
      } as AxiosResponse)

      const result = await getCategories()
      expect(mockedClient.get).toHaveBeenCalledWith('/api/categories')
      expect(result).toEqual(mockCategories)
    })

    it('카테고리 배열을 반환한다', async () => {
      ;(mockedClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockCategories,
      } as AxiosResponse)

      const result = await getCategories()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
    })

    it('에러를 그대로 전파한다', async () => {
      const error = { response: { status: 401, data: { message: '인증이 필요합니다.' } } }
      ;(mockedClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error)

      await expect(getCategories()).rejects.toEqual(error)
    })
  })

  describe('createCategory()', () => {
    it('POST /api/categories를 호출한다', async () => {
      const newCategory: Category = {
        id: 'cat-3',
        userId: 'user-1',
        name: '취미',
        isDefault: false,
        createdAt: '2026-01-01T00:00:00Z',
      }
      ;(mockedClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: newCategory,
      } as AxiosResponse)

      const input = { name: '취미' }
      const result = await createCategory(input)
      expect(mockedClient.post).toHaveBeenCalledWith('/api/categories', input)
      expect(result).toEqual(newCategory)
    })

    it('409 에러를 전파한다', async () => {
      const error = { response: { status: 409, data: { message: '이미 존재하는 카테고리명입니다.' } } }
      ;(mockedClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error)

      await expect(createCategory({ name: '업무' })).rejects.toEqual(error)
    })
  })

  describe('deleteCategory()', () => {
    it('DELETE /api/categories/:id를 호출한다', async () => {
      ;(mockedClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: undefined })

      await deleteCategory('cat-2')
      expect(mockedClient.delete).toHaveBeenCalledWith('/api/categories/cat-2')
    })

    it('403 에러를 전파한다 (기본 카테고리)', async () => {
      const error = { response: { status: 403, data: { message: '기본 카테고리는 삭제할 수 없습니다.' } } }
      ;(mockedClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error)

      await expect(deleteCategory('cat-1')).rejects.toEqual(error)
    })

    it('409 에러를 전파한다 (할일 연결됨)', async () => {
      const error = { response: { status: 409, data: { message: '해당 카테고리에 연결된 할일이 있어 삭제할 수 없습니다.' } } }
      ;(mockedClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error)

      await expect(deleteCategory('cat-2')).rejects.toEqual(error)
    })
  })
})
