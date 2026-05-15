import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/authApi'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'

export const useLogin = () => {
  const { setAuth } = useAuthStore()
  const { setTheme } = useThemeStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: login,
    onSuccess: ({ accessToken, user }) => {
      setAuth(accessToken, user)
      if (user.theme) {
        setTheme(user.theme)
      }
      navigate('/todos')
    },
  })
}
