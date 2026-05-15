import client from './client'
import type { RegisterInput, LoginInput, AuthResponse } from '../types/auth.types'

export const register = (data: RegisterInput) =>
  client.post<AuthResponse>('/api/auth/register', data).then((r) => r.data)

export const login = (data: LoginInput) =>
  client.post<AuthResponse>('/api/auth/login', data).then((r) => r.data)
