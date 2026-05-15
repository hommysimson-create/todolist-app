import client from './client'
import type { Category, CreateCategoryInput } from '../types/category.types'

export const getCategories = () =>
  client.get<Category[]>('/api/categories').then((r) => r.data)

export const createCategory = (data: CreateCategoryInput) =>
  client.post<Category>('/api/categories', data).then((r) => r.data)

export const deleteCategory = (id: string) =>
  client.delete(`/api/categories/${id}`)
