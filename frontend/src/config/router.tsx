import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { TodoListPage } from '../pages/todos/TodoListPage'
import { CategoryPage } from '../pages/categories/CategoryPage'
import { ProfilePage } from '../pages/users/ProfilePage'
import { PrivateRoute } from '../components/layout/PrivateRoute'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <PrivateRoute />,
    children: [
      { path: '/todos', element: <TodoListPage /> },
      { path: '/categories', element: <CategoryPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
  { path: '/', element: <Navigate to="/todos" replace /> },
])
