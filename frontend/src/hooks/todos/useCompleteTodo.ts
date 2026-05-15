import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleTodoComplete } from '../../api/todoApi'

export const useCompleteTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleTodoComplete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })
}
