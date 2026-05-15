# TodoListApp 프론트엔드 통합 가이드

- 버전: 1.0.0
- 작성일: 2026-05-14
- 참조 문서:
  - `2-prd.md` — 기능 요구사항 및 API 목록
  - `5-arch-diagram.md` — 시스템 아키텍처
  - `7-execution-plan.md` — FE Task 목록
  - `8-wireframe.md` — 화면 설계
  - `swagger/swagger.json` — API 명세 (전체 상세)

---

## 변경 이력

| 버전  | 변경일     | 변경 내용 | 변경자   |
| ----- | ---------- | --------- | -------- |
| 1.0.0 | 2026-05-14 | 최초 작성 | aliceKim |

---

## 1. 연동 개요

| 항목           | 내용                                          |
| -------------- | --------------------------------------------- |
| 백엔드 서버    | `http://localhost:3000`                       |
| API 접두사     | `/api`                                        |
| 응답 형식      | JSON                                          |
| 인증 방식      | JWT Bearer Token (`Authorization` 헤더)       |
| 토큰 만료      | 1시간 (1h)                                    |
| 토큰 저장 위치 | Zustand authStore 메모리 — localStorage 금지  |
| Swagger UI     | `http://localhost:3000/api-docs`              |

### 환경 변수 설정

```
# frontend/.env
VITE_API_BASE_URL=http://localhost:3000
```

---

## 2. TypeScript 타입 정의

```typescript
// frontend/src/types/auth.types.ts

export interface User {
  id: string;           // UUID
  email: string;        // 변경 불가 (BR-12)
  name: string;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RegisterInput {
  email: string;
  password: string;     // 최소 8자
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
```

```typescript
// frontend/src/types/category.types.ts

export interface Category {
  id: string;           // UUID
  userId: string | null; // null이면 기본 카테고리 (BR-07)
  name: string;
  isDefault: boolean;
  createdAt: string;    // ISO 8601
}

export interface CreateCategoryInput {
  name: string;
}
```

```typescript
// frontend/src/types/todo.types.ts

export interface Todo {
  id: string;           // UUID
  userId: string;       // UUID
  categoryId: string;   // UUID
  title: string;
  description: string | null;  // 선택 (BR-05)
  dueDate: string | null;      // YYYY-MM-DD, 선택 (BR-05)
  isCompleted: boolean;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

export interface CreateTodoInput {
  title: string;         // 필수 (BR-04)
  categoryId: string;    // 필수 (BR-04)
  description?: string;  // 선택
  dueDate?: string;      // 선택, YYYY-MM-DD
}

export interface UpdateTodoInput {
  title?: string;
  categoryId?: string;
  description?: string | null; // null 전달 시 제거
  dueDate?: string | null;     // null 전달 시 제거
}

export interface TodoFilters {
  categoryId?: string;
  startDate?: string;    // YYYY-MM-DD
  endDate?: string;      // YYYY-MM-DD
  isCompleted?: boolean;
}
```

```typescript
// frontend/src/types/api.types.ts

export interface ApiError {
  status: number;
  message: string;
}
```

---

## 3. Zustand authStore

JWT는 **반드시 Zustand 메모리에만 저장**한다. localStorage·sessionStorage·Cookie 사용 금지.

```typescript
// frontend/src/stores/authStore.ts
import { create } from 'zustand';
import type { User } from '../types/auth.types';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  setAuth: (token, user) => set({ accessToken: token, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
  isAuthenticated: () => get().accessToken !== null,
}));
```

**주의사항**
- 페이지 새로고침 시 토큰이 소멸되며 재로그인 필요 — 의도된 동작
- `useAuthStore.getState().accessToken` 으로 스토어 외부(인터셉터 등)에서 접근

---

## 4. Axios 클라이언트

```typescript
// frontend/src/api/client.ts
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터 — 토큰 자동 주입
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 — 401 시 로그아웃 처리
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

---

## 5. API 함수 구현

### 5.1 인증 API

```typescript
// frontend/src/api/authApi.ts
import client from './client';
import type { RegisterInput, LoginInput, AuthResponse } from '../types/auth.types';

export const register = (data: RegisterInput) =>
  client.post<AuthResponse>('/api/auth/register', data).then((r) => r.data);

export const login = (data: LoginInput) =>
  client.post<AuthResponse>('/api/auth/login', data).then((r) => r.data);
```

**요청/응답 예시**

```
POST /api/auth/register
Body: { "email": "user@example.com", "password": "securePass1!", "name": "김민준" }
→ 201: { "accessToken": "...", "user": { "id": "...", "email": "...", "name": "...", "createdAt": "...", "updatedAt": "..." } }
→ 409: { "status": 409, "message": "이미 사용 중인 이메일입니다." }
→ 400: { "status": 400, "message": "비밀번호는 최소 8자 이상이어야 합니다." }

POST /api/auth/login
Body: { "email": "user@example.com", "password": "securePass1!" }
→ 200: { "accessToken": "...", "user": { ... } }
→ 401: { "status": 401, "message": "이메일 또는 비밀번호가 올바르지 않습니다." }
```

### 5.2 사용자 API

```typescript
// frontend/src/api/userApi.ts
import client from './client';
import type { User } from '../types/auth.types';

export interface UpdateUserInput {
  name?: string;
  password?: string;   // 최소 8자, 미전송 시 변경 없음
}

export const getMe = () =>
  client.get<User>('/api/users/me').then((r) => r.data);

export const updateMe = (data: UpdateUserInput) =>
  client.patch<User>('/api/users/me', data).then((r) => r.data);

export const deleteMe = () =>
  client.delete('/api/users/me');
```

**요청/응답 예시**

```
GET /api/users/me
Headers: Authorization: Bearer {token}
→ 200: { "id": "...", "email": "...", "name": "...", "createdAt": "...", "updatedAt": "..." }

PATCH /api/users/me
Body: { "name": "민준킴" }            ← 이름만 변경
Body: { "password": "newPass123!" }    ← 비밀번호만 변경
→ 200: 수정된 User 객체

DELETE /api/users/me
→ 204: (본문 없음)
```

**이메일 수정 불가 (BR-12)**: `email` 필드는 요청 body에 포함해도 서버에서 무시한다. UI에서 읽기 전용으로 표시할 것.

### 5.3 카테고리 API

```typescript
// frontend/src/api/categoryApi.ts
import client from './client';
import type { Category, CreateCategoryInput } from '../types/category.types';

export const getCategories = () =>
  client.get<Category[]>('/api/categories').then((r) => r.data);

export const createCategory = (data: CreateCategoryInput) =>
  client.post<Category>('/api/categories', data).then((r) => r.data);

export const deleteCategory = (id: string) =>
  client.delete(`/api/categories/${id}`);
```

**요청/응답 예시**

```
GET /api/categories
→ 200: [
    { "id": "...", "userId": null, "name": "업무", "isDefault": true, "createdAt": "..." },
    { "id": "...", "userId": null, "name": "개인", "isDefault": true, "createdAt": "..." },
    { "id": "...", "userId": "{사용자ID}", "name": "사이드프로젝트", "isDefault": false, "createdAt": "..." }
  ]

POST /api/categories
Body: { "name": "사이드프로젝트" }
→ 201: { "id": "...", "userId": "...", "name": "사이드프로젝트", "isDefault": false, "createdAt": "..." }
→ 409: { "status": 409, "message": "이미 존재하는 카테고리명입니다." }

DELETE /api/categories/{id}
→ 204: (본문 없음)
→ 403: { "status": 403, "message": "기본 카테고리는 삭제할 수 없습니다." }
→ 409: { "status": 409, "message": "해당 카테고리에 연결된 할일이 있어 삭제할 수 없습니다." }
```

**카테고리 목록 구성**: 기본 카테고리(isDefault=true, userId=null) + 본인의 사용자 정의 카테고리만 반환됨 (BR-09).

### 5.4 할일 API

```typescript
// frontend/src/api/todoApi.ts
import client from './client';
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoFilters } from '../types/todo.types';

export const getTodos = (filters?: TodoFilters) =>
  client.get<Todo[]>('/api/todos', { params: filters }).then((r) => r.data);

export const createTodo = (data: CreateTodoInput) =>
  client.post<Todo>('/api/todos', data).then((r) => r.data);

export const updateTodo = (id: string, data: UpdateTodoInput) =>
  client.patch<Todo>(`/api/todos/${id}`, data).then((r) => r.data);

export const deleteTodo = (id: string) =>
  client.delete(`/api/todos/${id}`);

export const toggleTodoComplete = (id: string) =>
  client.patch<Todo>(`/api/todos/${id}/complete`).then((r) => r.data);
```

**요청/응답 예시**

```
GET /api/todos
GET /api/todos?isCompleted=false
GET /api/todos?categoryId={uuid}&startDate=2026-05-01&endDate=2026-05-31
→ 200: Todo[] (등록일 내림차순 정렬)

POST /api/todos
Body: { "title": "보고서 작성", "categoryId": "...", "dueDate": "2026-05-17" }
→ 201: Todo 객체 (isCompleted: false)
→ 400: { "status": 400, "message": "카테고리를 선택해 주세요." }

PATCH /api/todos/{id}
Body: { "dueDate": "2026-05-20" }   ← 전달한 필드만 업데이트
→ 200: 수정된 Todo 객체
→ 403: { "status": 403, "message": "접근 권한이 없습니다." }
→ 404: { "status": 404, "message": "존재하지 않는 할일입니다." }

DELETE /api/todos/{id}
→ 204: (본문 없음)

PATCH /api/todos/{id}/complete
→ 200: isCompleted가 토글된 Todo 객체
```

---

## 6. TanStack Query 훅

### 6.1 QueryClient 설정

```typescript
// frontend/src/config/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5분
    },
  },
});
```

```tsx
// frontend/src/main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';

// <QueryClientProvider client={queryClient}> 로 App 래핑
```

### 6.2 인증 훅

```typescript
// frontend/src/hooks/auth/useLogin.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/authApi';
import { useAuthStore } from '../../stores/authStore';

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: login,
    onSuccess: ({ accessToken, user }) => {
      setAuth(accessToken, user);
      navigate('/todos');
    },
  });
};
```

```typescript
// frontend/src/hooks/auth/useRegister.ts
import { useMutation } from '@tanstack/react-query';
import { register } from '../../api/authApi';

export const useRegister = () =>
  useMutation({ mutationFn: register });
```

### 6.3 사용자 훅

```typescript
// frontend/src/hooks/users/useMe.ts
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../api/userApi';

export const useMe = () =>
  useQuery({ queryKey: ['me'], queryFn: getMe });
```

```typescript
// frontend/src/hooks/users/useDeleteMe.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deleteMe } from '../../api/userApi';
import { useAuthStore } from '../../stores/authStore';
import { queryClient } from '../../config/queryClient';

export const useDeleteMe = () => {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: deleteMe,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
  });
};
```

### 6.4 카테고리 훅

```typescript
// frontend/src/hooks/categories/useCategories.ts
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../api/categoryApi';

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: getCategories });
```

```typescript
// frontend/src/hooks/categories/useCreateCategory.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory } from '../../api/categoryApi';

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};
```

```typescript
// frontend/src/hooks/categories/useDeleteCategory.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCategory } from '../../api/categoryApi';

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};
```

### 6.5 할일 훅

```typescript
// frontend/src/hooks/todos/useTodos.ts
import { useQuery } from '@tanstack/react-query';
import { getTodos } from '../../api/todoApi';
import type { TodoFilters } from '../../types/todo.types';

export const useTodos = (filters?: TodoFilters) =>
  useQuery({
    queryKey: ['todos', filters],
    queryFn: () => getTodos(filters),
  });
```

```typescript
// frontend/src/hooks/todos/useCreateTodo.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTodo } from '../../api/todoApi';

export const useCreateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};
```

나머지 할일 훅(`useUpdateTodo`, `useDeleteTodo`, `useCompleteTodo`)도 동일 패턴:
- `mutationFn`: 해당 API 함수
- `onSuccess`: `queryClient.invalidateQueries({ queryKey: ['todos'] })`

---

## 7. 에러 처리 패턴

### 표준 에러 응답 형식

모든 에러 응답은 아래 형식을 따른다:

```json
{ "status": 400, "message": "제목은 필수입니다." }
```

### Axios 에러에서 메시지 추출

```typescript
import axios from 'axios';

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || '요청 처리 중 오류가 발생했습니다.';
  }
  return '알 수 없는 오류가 발생했습니다.';
};
```

### 화면별 에러 처리 요약

| 상태 코드 | 상황                                           | 프론트엔드 처리                                               |
| --------- | ---------------------------------------------- | ------------------------------------------------------------- |
| 400       | 필수값 누락, 형식 오류, 비밀번호 8자 미만      | 에러 메시지 필드 옆에 표시                                    |
| 401       | 토큰 없음/만료, 로그인 실패                    | 응답 인터셉터에서 `clearAuth()` + `/login` 리다이렉트         |
| 403       | 타인 리소스 접근, 기본 카테고리 삭제 시도      | 에러 메시지 표시 (삭제 못한 이유 안내)                        |
| 404       | 존재하지 않는 리소스                           | 에러 메시지 표시                                              |
| 409       | 중복 이메일, 중복 카테고리명, 할일 연결된 삭제 | 에러 메시지 표시                                              |

---

## 8. 인증 가드 (PrivateRoute)

```tsx
// frontend/src/components/layout/PrivateRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const PrivateRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
```

### 라우트 구성

```tsx
// frontend/src/config/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { PrivateRoute } from '../components/layout/PrivateRoute';

export const router = createBrowserRouter([
  { path: '/login',    element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <PrivateRoute />,
    children: [
      { path: '/todos',      element: <TodoListPage /> },
      { path: '/categories', element: <CategoryPage /> },
      { path: '/profile',    element: <ProfilePage /> },
    ],
  },
  { path: '/', element: <Navigate to="/todos" replace /> },
]);
```

---

## 9. 화면별 API 연동 요약

### SCR-01 회원가입

| 액션   | API                          | 성공 처리                  | 에러 처리                                      |
| ------ | ---------------------------- | -------------------------- | ---------------------------------------------- |
| 가입   | `POST /api/auth/register`    | `/login` 으로 이동         | 409: 중복 이메일 메시지 / 400: 유효성 메시지   |

- 로컬 유효성: 이메일 정규식, 비밀번호 최소 8자 (서버 요청 전 검증)

### SCR-02 로그인

| 액션   | API                       | 성공 처리                               | 에러 처리                     |
| ------ | ------------------------- | --------------------------------------- | ----------------------------- |
| 로그인 | `POST /api/auth/login`    | `setAuth(token, user)` → `/todos` 이동  | 401: "이메일 또는 비밀번호가 올바르지 않습니다" |

### SCR-03 할일 목록

| 액션           | API                                      | 성공 처리          |
| -------------- | ---------------------------------------- | ------------------ |
| 목록 조회      | `GET /api/todos?...`                     | 목록 렌더링        |
| 필터 적용      | `GET /api/todos?categoryId=&startDate=&endDate=&isCompleted=` | 필터된 목록 렌더링 |
| 완료 토글      | `PATCH /api/todos/{id}/complete`         | `['todos']` 무효화 |
| 할일 삭제      | `DELETE /api/todos/{id}`                 | `['todos']` 무효화 |

- `useTodos(filters)` — `queryKey: ['todos', filters]` 로 필터 변경 시 자동 재조회

### SCR-04 할일 등록/수정 (모달)

| 액션   | API                          | 성공 처리                               |
| ------ | ---------------------------- | --------------------------------------- |
| 등록   | `POST /api/todos`            | 모달 닫기 + `['todos']` 무효화          |
| 수정   | `PATCH /api/todos/{id}`      | 모달 닫기 + `['todos']` 무효화          |

- 카테고리 선택 드롭다운: `useCategories()` 데이터 활용
- `categoryId` 필수 (BR-04)

### SCR-05 카테고리 관리

| 액션           | API                            | 성공/에러 처리                                                |
| -------------- | ------------------------------ | ------------------------------------------------------------- |
| 목록 조회      | `GET /api/categories`          | isDefault 기준으로 기본/사용자 정의 그룹 분리 표시            |
| 카테고리 추가  | `POST /api/categories`         | `['categories']` 무효화 / 409: 중복명 메시지                 |
| 카테고리 삭제  | `DELETE /api/categories/{id}`  | `['categories']` 무효화 / 403: 기본 카테고리 / 409: 할일 연결됨 |

- `isDefault: true` 카테고리의 삭제 버튼은 UI에서 `disabled` 처리

### SCR-06 내 정보 수정

| 액션       | API                     | 성공 처리                              | 에러 처리                  |
| ---------- | ----------------------- | -------------------------------------- | -------------------------- |
| 초기 데이터 | `GET /api/users/me`     | 이메일·이름 필드 채우기                | -                          |
| 정보 수정  | `PATCH /api/users/me`   | `['me']` 무효화 + 성공 메시지 표시     | 400: 비밀번호 8자 미만     |
| 회원 탈퇴  | `DELETE /api/users/me`  | `clearAuth()` + 캐시 초기화 + `/login` | -                          |

- 이메일 필드: `readOnly` 속성 적용 (BR-12)
- 비밀번호 미입력 시 변경 없음 — body에서 `password` 키 제외 후 요청

---

## 10. 로그아웃 처리

```typescript
// Header 컴포넌트의 로그아웃 버튼
const handleLogout = () => {
  useAuthStore.getState().clearAuth();
  queryClient.clear(); // 캐시된 사용자 데이터 제거
  navigate('/login');
};
```

---

## 11. 페이지 새로고침 동작

JWT를 메모리에만 저장하므로 새로고침 시 토큰이 소멸한다.

- PrivateRoute에서 `isAuthenticated()` → false → `/login` 리다이렉트
- 이는 의도된 보안 동작 (localStorage 미사용 정책)
- 사용자에게 "세션이 만료되었습니다. 다시 로그인해주세요" 안내 권장

---

## 12. 주요 비즈니스 규칙 구현 체크리스트

| 규칙  | 내용                                      | 프론트엔드 구현 포인트                                         |
| ----- | ----------------------------------------- | -------------------------------------------------------------- |
| BR-03 | 본인 할일만 접근 가능                     | API가 서버에서 필터링하므로 별도 처리 불필요                   |
| BR-04 | 할일 등록 시 카테고리 필수                | `categoryId` 미선택 시 제출 버튼 비활성화 또는 검증 메시지     |
| BR-05 | 설명, 마감일은 선택                       | 폼에서 선택 항목으로 표시, API 요청 시 미입력 필드 생략        |
| BR-06 | 완료 상태에서도 수정/취소 가능            | 완료 상태 할일의 수정/삭제 버튼 활성 유지                      |
| BR-07 | 기본 카테고리 user_id=null                | `isDefault: true`로 판별, 별도 "기본" 배지 표시                |
| BR-09 | 사용자 정의 카테고리는 본인 것만 노출     | API가 서버에서 필터링하므로 별도 처리 불필요                   |
| BR-10 | 할일 연결 카테고리 삭제 불가              | 삭제 시도 후 409 응답 시 에러 메시지 표시                      |
| BR-12 | 이메일 변경 불가                          | 이메일 Input을 `readOnly`로 설정, PATCH body에 email 미포함    |

---

## 13. 디렉토리 구조 (권장)

```
frontend/src/
├── api/
│   ├── client.ts          # Axios 인스턴스 + 인터셉터
│   ├── authApi.ts
│   ├── categoryApi.ts
│   ├── todoApi.ts
│   └── userApi.ts
├── stores/
│   ├── authStore.ts        # JWT + User (메모리 only)
│   └── todoFilterStore.ts  # 할일 필터 상태
├── hooks/
│   ├── auth/
│   │   ├── useLogin.ts
│   │   └── useRegister.ts
│   ├── categories/
│   │   ├── useCategories.ts
│   │   ├── useCreateCategory.ts
│   │   └── useDeleteCategory.ts
│   ├── todos/
│   │   ├── useTodos.ts
│   │   ├── useCreateTodo.ts
│   │   ├── useUpdateTodo.ts
│   │   ├── useDeleteTodo.ts
│   │   └── useCompleteTodo.ts
│   └── users/
│       ├── useMe.ts
│       ├── useUpdateMe.ts
│       └── useDeleteMe.ts
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── todos/
│   │   └── TodoListPage.tsx
│   ├── categories/
│   │   └── CategoryPage.tsx
│   └── users/
│       └── ProfilePage.tsx
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   └── ErrorMessage.tsx
│   ├── todos/
│   │   ├── TodoCard.tsx
│   │   ├── TodoList.tsx
│   │   ├── TodoForm.tsx
│   │   └── TodoFilter.tsx
│   └── layout/
│       ├── Header.tsx
│       └── PrivateRoute.tsx
├── config/
│   ├── queryClient.ts
│   └── router.tsx
├── types/
│   ├── auth.types.ts
│   ├── category.types.ts
│   ├── todo.types.ts
│   └── api.types.ts
└── styles/
    └── globals.css
```
