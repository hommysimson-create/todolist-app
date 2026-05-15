import client from './client'
import type { User } from '../types/auth.types'

export interface UpdateUserInput {
  name?: string;
  password?: string;
  theme?: 'light' | 'dark';
}

export const getMe = () =>
  client.get<User>('/api/users/me').then((r) => r.data)

export const updateMe = (data: UpdateUserInput) =>
  client.patch<User>('/api/users/me', data).then((r) => r.data)

export const deleteMe = () =>
  client.delete('/api/users/me')
