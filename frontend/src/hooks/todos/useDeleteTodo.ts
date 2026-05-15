import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTodo } from '../../api/todoApi'

export const useDeleteTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })
}
