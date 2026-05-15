import { useMutation } from '@tanstack/react-query'
import { register } from '../../api/authApi'

export const useRegister = () =>
  useMutation({ mutationFn: register })
