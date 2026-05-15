import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTodo } from '../../api/todoApi'
import type { UpdateTodoInput } from '../../types/todo.types'

export const useUpdateTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoInput }) =>
      updateTodo(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })
}
