import { useQuery } from '@tanstack/react-query'
import { getMe } from '../../api/userApi'

export const useMe = () =>
  useQuery({ queryKey: ['me'], queryFn: getMe })
