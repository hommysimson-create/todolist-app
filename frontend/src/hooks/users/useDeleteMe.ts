import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { deleteMe } from '../../api/userApi'
import { useAuthStore } from '../../stores/authStore'
import { queryClient } from '../../config/queryClient'

export const useDeleteMe = () => {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: deleteMe,
    onSuccess: () => {
      clearAuth()
      queryClient.clear()
      navigate('/login')
    },
  })
}
