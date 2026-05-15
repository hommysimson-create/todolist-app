import client from './client'
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoFilters } from '../types/todo.types'

export const getTodos = (filters?: TodoFilters) =>
  client.get<Todo[]>('/api/todos', { params: filters }).then((r) => r.data)

export const createTodo = (data: CreateTodoInput) =>
  client.post<Todo>('/api/todos', data).then((r) => r.data)

export const updateTodo = (id: string, data: UpdateTodoInput) =>
  client.patch<Todo>(`/api/todos/${id}`, data).then((r) => r.data)

export const deleteTodo = (id: string) =>
  client.delete(`/api/todos/${id}`)

export const toggleTodoComplete = (id: string) =>
  client.patch<Todo>(`/api/todos/${id}/complete`).then((r) => r.data)
