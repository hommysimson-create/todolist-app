import { useQuery } from '@tanstack/react-query'
import { getTodos } from '../../api/todoApi'
import type { TodoFilters } from '../../types/todo.types'

export const useTodos = (filters?: TodoFilters) =>
  useQuery({
    queryKey: ['todos', filters],
    queryFn: () => getTodos(filters),
  })
