export interface Todo {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  categoryId: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateTodoInput {
  title?: string;
  categoryId?: string;
  description?: string | null;
  dueDate?: string | null;
}

export interface TodoFilters {
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  isCompleted?: boolean;
}
