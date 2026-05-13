# TodoListApp 실행계획

- 버전: 1.0.0
- 작성일: 2026-05-13
- 참조 문서:
  - `2-prd.md` — 기능 요구사항 및 API 목록
  - `4-project-principles.md` — 레이어 구조 및 의존성 원칙
  - `5-arch-diagram.md` — 기술 아키텍처 다이어그램
  - `6-erd.md` — ERD 및 테이블 정의
  - `database/schema.sql` — DDL 스크립트

---

## 변경 이력

| 버전  | 변경일     | 변경 내용 | 변경자   |
|-------|------------|-----------|----------|
| 1.0.0 | 2026-05-13 | 최초 작성 | aliceKim |

---

## 개요

### 개발 일정 (3일)

| 일차 | 주요 작업 |
|------|-----------|
| Day 1 | DB 환경 구성, 백엔드 프로젝트 셋업, 인증 API (회원가입·로그인), JWT 미들웨어 |
| Day 2 | 할일 CRUD API, 카테고리 API, 사용자 정보 수정·탈퇴 API, 백엔드 테스트 |
| Day 3 | 프론트엔드 전체 화면 구현 (SCR-01~06), 통합 테스트 및 버그 수정 |

### Task 분류

| 레이어 | Task 수 | 예상 시간 |
|--------|---------|----------|
| 데이터베이스 (DB) | 6개 | 2시간 |
| 백엔드 (BE) | 26개 | 20시간 |
| 프론트엔드 (FE) | 35개 | 45시간 |
| **합계** | **67개** | **약 67시간** |

---

## 1. 데이터베이스 (DB) Task

---

### DB-01 · PostgreSQL 17 환경 구성

**상세 작업 내용**
- `docker-compose.yml` 생성 (루트 디렉토리)
- PostgreSQL 17 이미지, 환경 변수, Volume 마운트, Health check 설정
- `.env.example` 작성: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

**완료 조건**
- [ ] `docker-compose.yml` 작성 완료
- [ ] `.env.example`에 DB 환경 변수 키 목록 기재
- [ ] `docker-compose up -d` 실행 후 PostgreSQL 17 컨테이너 정상 시작
- [ ] `SELECT version()` 실행 → PostgreSQL 17 확인

**의존성**: 없음
**예상 소요 시간**: 15분

---

### DB-02 · DDL 스크립트 실행

**상세 작업 내용**
- `database/schema.sql` 실행: `psql -U postgres -h localhost -d todolist_dev -f database/schema.sql`
- pgcrypto 확장 활성화 확인 (`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)
- 테이블 3개 생성 확인 (users, categories, todos)
- 제약 조건 확인: PK, FK(CASCADE/RESTRICT), UNIQUE, CHECK

**완료 조건**
- [ ] `SELECT extname FROM pg_extension WHERE extname='pgcrypto'` → 결과 확인
- [ ] users 테이블: 6개 컬럼 + UNIQUE(email)
- [ ] categories 테이블: 5개 컬럼 + FK CASCADE + CHECK(is_default→user_id IS NULL)
- [ ] todos 테이블: 9개 컬럼 + FK CASCADE(users) + FK RESTRICT(categories)
- [ ] 인덱스 5개 생성 확인

**의존성**: DB-01
**예상 소요 시간**: 10분

---

### DB-03 · 기본 카테고리 Seed 데이터 확인

**상세 작업 내용**
- schema.sql에 포함된 SEED INSERT 실행 확인
  - 업무, 개인, 쇼핑, 건강, 학습 (user_id=NULL, is_default=true)
- 삽입 결과 검증

**완료 조건**
- [ ] `SELECT COUNT(*) FROM categories WHERE is_default=true` → 5
- [ ] 각 카테고리 `is_default=true`, `user_id=NULL` 확인
- [ ] 카테고리명 5개(업무, 개인, 쇼핑, 건강, 학습) 정확성 확인

**의존성**: DB-02
**예상 소요 시간**: 5분

---

### DB-04 · 개발/테스트 DB 분리

**상세 작업 내용**
- 개발 DB: `todolist_dev`, 테스트 DB: `todolist_test`
- `NODE_ENV=test`일 때 `DB_NAME=todolist_test`로 분기
- 테스트 DB에 schema.sql 동일하게 적용

**완료 조건**
- [ ] `todolist_test` DB 생성 및 스키마 적용 완료
- [ ] `NODE_ENV` 기반 DB_NAME 분기 로직 작성
- [ ] 테스트 실행 전 테이블 초기화 (`TRUNCATE`) 스크립트 작성

**의존성**: DB-01, DB-02
**예상 소요 시간**: 20분

---

### DB-05 · pg Pool 연결 설정

**상세 작업 내용**
- 파일: `server/src/db/pool.ts`
- `pg.Pool` 싱글톤 생성, 환경 변수 기반 설정
- `DB_PASSWORD` 누락 시 프로세스 종료 처리

```typescript
// server/src/db/pool.ts
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
```

**완료 조건**
- [ ] `server/src/db/pool.ts` 생성 완료
- [ ] 필수 환경 변수 8개 `.env.example`에 문서화
- [ ] `pool.query('SELECT 1')` 연결 성공 확인
- [ ] `tsc --noEmit` 에러 없음

**의존성**: DB-02, DB-04
**예상 소요 시간**: 25분

---

### DB-06 · Repository 레이어 기본 구조

**상세 작업 내용**
- `server/src/repositories/userRepository.ts`
- `server/src/repositories/categoryRepository.ts`
- `server/src/repositories/todoRepository.ts`
- ORM 금지: 모든 쿼리는 pg 파라미터화 쿼리(`$1, $2, ...`) 사용
- DB 에러는 Repository에서 catch하지 않고 Service로 전파

**완료 조건**
- [ ] 3개 Repository 파일 생성 완료
- [ ] 모든 SQL 쿼리 파라미터화 확인 (문자열 동적 연결 금지)
- [ ] userRepository: `findByEmail`, `findById`, `create`, `update`, `delete` 최소 5개 함수
- [ ] categoryRepository: `findByUserIdAndDefault`, `findById`, `create`, `delete` 최소 4개 함수
- [ ] todoRepository: `findByUserIdWithFilter`, `findById`, `create`, `update`, `delete`, `updateCompleted` 최소 6개 함수
- [ ] `tsc --noEmit` 에러 없음

**의존성**: DB-02, DB-05
**예상 소요 시간**: 45분

---

## 2. 백엔드 (BE) Task

---

### BE-01 · 프로젝트 초기 셋업

**상세 작업 내용**
- `server/` 디렉토리 및 `package.json` 작성
- 의존성 설치: `typescript`, `express`, `pg`, `jsonwebtoken`, `bcrypt`, `dotenv`
- 개발 의존성: `jest`, `supertest`, `ts-jest`, `@types/*`
- `tsconfig.json`: target ES2020, module commonjs, strict true
- 디렉토리 구조: `server/src/{routes,controllers,services,repositories,middlewares,db,types,utils}`
- `jest.config.js` 작성 (preset: ts-jest, testEnvironment: node)

**완료 조건**
- [ ] `server/package.json` 및 `node_modules` 설치 완료
- [ ] `tsconfig.json` 컴파일 에러 0건
- [ ] 전체 디렉토리 구조 생성 완료
- [ ] `.env.example` 작성 (`NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=1h`)

**의존성**: 없음
**예상 소요 시간**: 30분

---

### BE-02 · 에러 핸들링 미들웨어

**상세 작업 내용**
- 파일: `server/src/middlewares/errorHandler.ts`
- HTTP 상태 코드별 JSON 표준 응답: `{ status, message }`
- 400, 401, 403, 404, 409, 500 처리
- 스택 트레이스는 로그에만 기록, 응답에 미포함 (운영 환경)

**완료 조건**
- [ ] `errorHandler.ts` 작성 완료
- [ ] 6개 HTTP 상태 코드 모두 처리
- [ ] 500 에러 시 클라이언트에 상세 정보 미노출 확인

**의존성**: BE-01
**예상 소요 시간**: 30분

---

### BE-03 · JWT 유틸 및 인증 미들웨어

**상세 작업 내용**
- 파일: `server/src/utils/jwt.ts`
  - `sign(payload)` → token (만료: 1h, `JWT_SECRET` 사용)
  - `verify(token)` → payload 또는 에러 throw
- 파일: `server/src/middlewares/authenticate.ts`
  - `Authorization: Bearer {token}` 헤더에서 토큰 추출
  - 검증 성공 시 `req.user` 주입 (`userId`, `email`)
  - 검증 실패/만료 시 401 응답
- 파일: `server/src/types/express.d.ts` (req.user 타입 확장)

**완료 조건**
- [ ] `jwt.ts` sign/verify 함수 구현
- [ ] `authenticate.ts` 미들웨어 작성
- [ ] `express.d.ts` req.user 타입 확장
- [ ] JWT 만료 시간 1h 명시
- [ ] 만료 토큰 사용 시 401 응답 확인

**의존성**: BE-01
**예상 소요 시간**: 40분

---

### BE-04 · bcrypt 유틸 함수

**상세 작업 내용**
- 파일: `server/src/utils/hash.ts`
  - `hashPassword(plainPassword)` → bcrypt 해시 (saltRounds: 12)
  - `comparePassword(plain, hashed)` → boolean
- 평문 비밀번호 로그 출력 금지

**완료 조건**
- [ ] `hash.ts` 작성 완료
- [ ] bcrypt saltRounds: 12 명시
- [ ] 평문 비밀번호 로그 미포함

**의존성**: BE-01
**예상 소요 시간**: 20분

---

### BE-05 · 입력값 검증 유틸

**상세 작업 내용**
- 파일: `server/src/utils/validate.ts`
  - `isValidEmail(email)` — RFC 5322 정규식
  - `isValidPassword(password)` — 최소 8자
  - `isValidUUID(uuid)`
  - `isValidDate(dateString)` — YYYY-MM-DD
  - `isValidName(name)` — 1~100자
  - `isValidTitle(title)` — 1~255자

**완료 조건**
- [ ] `validate.ts` 작성 완료
- [ ] 6개 검증 함수 구현 및 export

**의존성**: BE-01
**예상 소요 시간**: 30분

---

### BE-06 · 회원가입 API (UC-01)

**상세 작업 내용**
- `server/src/routes/authRoutes.ts`: `POST /api/auth/register`
- Controller: 이메일 형식, 비밀번호 최소 8자, 이름 필수 검증 → 실패 시 400
- Service: 이메일 중복 확인 → 409, bcrypt 해시 후 저장
- Repository: `INSERT INTO users ...`
- 응답: 201 Created (비밀번호 미포함)

**완료 조건**
- [ ] Route → Controller → Service → Repository 4개 레이어 구현
- [ ] 비밀번호 최소 8자 검증 (Controller 레이어)
- [ ] 중복 이메일 409 Conflict 응답 확인
- [ ] 응답 본문에 password 미포함 확인

**의존성**: BE-01, BE-02, BE-03, BE-04, BE-05, DB-06
**예상 소요 시간**: 60분

---

### BE-07 · 로그인 API (UC-02)

**상세 작업 내용**
- `POST /api/auth/login`
- Controller: 이메일·비밀번호 형식 검증
- Service: 사용자 조회 → bcrypt 비교 → JWT 발급
- 응답: 200 OK + `{ accessToken, user: { id, email, name } }`
- 이메일 없거나 비밀번호 불일치: 401 Unauthorized

**완료 조건**
- [ ] Route → Controller → Service → Repository 4개 레이어 구현
- [ ] JWT 만료 시간 1h 명시
- [ ] 잘못된 자격증명 시 401 응답 확인
- [ ] 응답 본문에 password 미포함 확인

**의존성**: BE-01, BE-02, BE-03, BE-04, BE-05, BE-06, DB-06
**예상 소요 시간**: 50분

---

### BE-08 · 내 정보 조회 API

**상세 작업 내용**
- `GET /api/users/me` (인증 필요)
- `server/src/routes/userRoutes.ts` 생성
- Service: `findById(userId)` 조회
- 응답: 200 OK + `{ id, email, name, createdAt }` (password 제외)

**완료 조건**
- [ ] Route → Controller → Service → Repository 구현
- [ ] authenticate 미들웨어 적용 확인
- [ ] 응답에 password 미포함 확인

**의존성**: BE-01, BE-02, BE-03, DB-06
**예상 소요 시간**: 40분

---

### BE-09 · 내 정보 수정 API (UC-03)

**상세 작업 내용**
- `PATCH /api/users/me` (인증 필요)
- 수정 가능: name, password / 수정 불가: email (BR-12)
- Controller: 비밀번호 수정 시 최소 8자 검증
- Service: 비밀번호 포함 시 bcrypt 해시 후 저장
- 응답: 200 OK + 수정된 사용자 정보 (password 제외)

**완료 조건**
- [ ] Route → Controller → Service → Repository 구현
- [ ] 비밀번호 최소 8자 검증 (Controller 레이어)
- [ ] 이메일 수정 불가 확인 (BR-12)
- [ ] 응답에 password 미포함 확인

**의존성**: BE-01, BE-02, BE-03, BE-04, BE-05, BE-08, DB-06
**예상 소요 시간**: 45분

---

### BE-10 · 회원 탈퇴 API (UC-11)

**상세 작업 내용**
- `DELETE /api/users/me` (인증 필요)
- Service: `DELETE FROM users WHERE id = $1` (CASCADE DELETE로 todos, categories 자동 삭제)
- 응답: 204 No Content

**완료 조건**
- [ ] Route → Controller → Service → Repository 구현
- [ ] 204 No Content 응답 확인
- [ ] DB CASCADE DELETE 동작 확인 (users 삭제 → todos, categories 삭제)

**의존성**: BE-01, BE-02, BE-03, BE-08, DB-06
**예상 소요 시간**: 45분

---

### BE-11 · 카테고리 목록 조회 API

**상세 작업 내용**
- `GET /api/categories` (인증 필요)
- `server/src/routes/categoryRoutes.ts` 생성
- Repository SQL: `SELECT ... FROM categories WHERE is_default=true OR user_id=$1 ORDER BY is_default DESC, name ASC`
- 응답: 기본 카테고리 전체 + 요청자의 사용자 정의 카테고리 (BR-09)

**완료 조건**
- [ ] Route → Controller → Service → Repository 구현
- [ ] 기본 카테고리 + 사용자 정의 카테고리 함께 반환 확인
- [ ] 타인의 사용자 정의 카테고리 미포함 확인 (BR-09)

**의존성**: BE-01, BE-02, BE-03, DB-06
**예상 소요 시간**: 40분

---

### BE-12 · 카테고리 생성 API (UC-09)

**상세 작업 내용**
- `POST /api/categories` (인증 필요)
- Controller: name 필수 검증 (1~100자)
- Service: 동일 사용자 내 카테고리명 중복 확인 → 409 (BR-09)
- Repository: `INSERT INTO categories (user_id=요청자ID, is_default=false)`
- 응답: 201 Created

**완료 조건**
- [ ] Route → Controller → Service → Repository 구현
- [ ] 동일 사용자 중복 카테고리명 409 Conflict 확인
- [ ] is_default=false, user_id=요청자 ID 저장 확인

**의존성**: BE-01, BE-02, BE-03, BE-05, BE-11, DB-06
**예상 소요 시간**: 40분

---

### BE-13 · 카테고리 삭제 API (UC-10)

**상세 작업 내용**
- `DELETE /api/categories/:id` (인증 필요)
- Service 검증:
  1. 카테고리 존재 확인 → 404
  2. 기본 카테고리 삭제 시도 → 403 (BR-10)
  3. 타인 카테고리 → 403
  4. 연결된 할일 존재 → 409 Conflict (BR-10)
- 응답: 204 No Content

**완료 조건**
- [ ] Route → Controller → Service → Repository 구현
- [ ] 기본 카테고리 삭제 시도 403 Forbidden 확인
- [ ] 할일 연결된 카테고리 삭제 409 Conflict 확인 (BR-10)
- [ ] 타인 카테고리 403 Forbidden 확인

**의존성**: BE-01, BE-02, BE-03, BE-11, DB-06
**예상 소요 시간**: 50분

---

### BE-14 · 할일 목록 조회 API (UC-08)

**상세 작업 내용**
- `GET /api/todos?categoryId=&startDate=&endDate=&isCompleted=` (인증 필요)
- `server/src/routes/todoRoutes.ts` 생성
- Controller: 쿼리 파라미터 파싱 및 유효성 검증
- Service: 본인 할일만 조회 (BR-03)
- Repository: 동적 필터 쿼리, 기본 정렬 `ORDER BY created_at DESC`

**완료 조건**
- [ ] Route → Controller → Service → Repository 구현
- [ ] 4개 필터 파라미터(categoryId, startDate, endDate, isCompleted) 동작 확인
- [ ] 등록일 내림차순 기본 정렬 확인
- [ ] 본인 할일만 조회 확인 (BR-03)

**의존성**: BE-01, BE-02, BE-03, BE-05, DB-06
**예상 소요 시간**: 60분

---

### BE-15 · 할일 등록 API (UC-04)

**상세 작업 내용**
- `POST /api/todos` (인증 필요)
- Controller: title (필수, 1~255자), categoryId (필수) 검증 → 400
- Service: categoryId 존재 및 접근 권한 확인 → 400
- Repository: `INSERT INTO todos (is_completed=false, ...)`
- 응답: 201 Created

**완료 조건**
- [ ] Route → Controller → Service → Repository 구현
- [ ] title, categoryId 필수 검증 → 400 확인
- [ ] 존재하지 않는 categoryId → 400 확인
- [ ] is_completed=false 초기값 확인

**의존성**: BE-01, BE-02, BE-03, BE-05, BE-11, BE-14, DB-06
**예상 소요 시간**: 50분

---

### BE-16 · 할일 수정 API (UC-05)

**상세 작업 내용**
- `PATCH /api/todos/:id` (인증 필요)
- Service: 존재 확인 → 404, 소유권 확인 → 403
- 수정 가능 필드: title, description, dueDate, categoryId
- 응답: 200 OK + 수정된 할일

**완료 조건**
- [ ] Route → Controller → Service → Repository 구현
- [ ] 존재하지 않는 할일 404 Not Found 확인
- [ ] 타인 할일 수정 시도 403 Forbidden 확인

**의존성**: BE-01, BE-02, BE-03, BE-05, BE-14, DB-06
**예상 소요 시간**: 50분

---

### BE-17 · 할일 삭제 API (UC-06)

**상세 작업 내용**
- `DELETE /api/todos/:id` (인증 필요)
- Service: 존재 확인 → 404, 소유권 확인 → 403
- 응답: 204 No Content

**완료 조건**
- [ ] Route → Controller → Service → Repository 구현
- [ ] 존재하지 않는 할일 404 Not Found 확인
- [ ] 타인 할일 삭제 시도 403 Forbidden 확인

**의존성**: BE-01, BE-02, BE-03, BE-14, DB-06
**예상 소요 시간**: 40분

---

### BE-18 · 할일 완료 토글 API (UC-07)

**상세 작업 내용**
- `PATCH /api/todos/:id/complete` (인증 필요)
- Service: 존재 확인 → 404, 소유권 확인 → 403
- Repository SQL: `UPDATE todos SET is_completed = NOT is_completed, updated_at = NOW() WHERE id = $1 RETURNING *`
- 완료 상태에서도 취소 가능 (BR-06)
- 응답: 200 OK + 변경된 할일

**완료 조건**
- [ ] Route → Controller → Service → Repository 구현
- [ ] is_completed 토글 (true↔false) 동작 확인
- [ ] 타인 할일 403 Forbidden 확인

**의존성**: BE-01, BE-02, BE-03, BE-14, DB-06
**예상 소요 시간**: 40분

---

### BE-19 · Express 앱 초기화 및 라우터 등록

**상세 작업 내용**
- 파일: `server/app.ts`
- 미들웨어 등록 순서: `express.json()` → 로깅 → CORS → 라우터 → errorHandler
- 라우터 등록: `/api/auth`, `/api/users`, `/api/todos`, `/api/categories`
- 404 Not Found 핸들러 추가
- PORT 환경 변수 기반 서버 시작 (기본값: 3000)

**완료 조건**
- [ ] `app.ts` 작성 완료
- [ ] 4개 라우터 등록 확인
- [ ] errorHandler 마지막 등록 확인
- [ ] `node dist/app.js` 서버 정상 시작 확인

**의존성**: BE-02, BE-03, BE-06 ~ BE-18
**예상 소요 시간**: 30분

---

### BE-20 · Jest + Supertest 테스트 환경 설정

**상세 작업 내용**
- `jest.config.js` 작성: preset ts-jest, testEnvironment node
- 디렉토리 구조: `server/tests/unit/`, `server/tests/integration/`
- package.json 스크립트: `test`, `test:watch`, `test:coverage`

**완료 조건**
- [ ] `jest.config.js` 작성 완료
- [ ] `npm test` 실행 가능 확인

**의존성**: BE-01
**예상 소요 시간**: 30분

---

### BE-21 · 인증 API 통합 테스트

**상세 작업 내용**
- 파일: `server/tests/integration/auth.test.ts`
- 테스트 케이스:
  - POST /api/auth/register 성공 (201)
  - POST /api/auth/register 중복 이메일 (409)
  - POST /api/auth/register 비밀번호 8자 미만 (400)
  - POST /api/auth/login 성공 (200 + accessToken)
  - POST /api/auth/login 잘못된 비밀번호 (401)

**완료 조건**
- [ ] `auth.test.ts` 작성 완료
- [ ] 5개 테스트 케이스 모두 통과
- [ ] 테스트 커버리지 80% 이상

**의존성**: BE-06, BE-07, BE-20
**예상 소요 시간**: 60분

---

### BE-22 · 카테고리 API 통합 테스트

**상세 작업 내용**
- 파일: `server/tests/integration/categories.test.ts`
- 테스트 케이스:
  - GET /api/categories 기본 카테고리 포함 (200)
  - POST /api/categories 사용자 정의 카테고리 생성 (201)
  - POST /api/categories 중복 카테고리명 (409)
  - DELETE /api/categories/:id 성공 (204)
  - DELETE /api/categories/:id 기본 카테고리 (403)
  - DELETE /api/categories/:id 할일 연결됨 (409)

**완료 조건**
- [ ] `categories.test.ts` 작성 완료
- [ ] 6개 테스트 케이스 모두 통과
- [ ] 할일 연결 카테고리 삭제 409 응답 검증 (BR-10)

**의존성**: BE-11, BE-12, BE-13, BE-20
**예상 소요 시간**: 70분

---

### BE-23 · 할일 API 통합 테스트

**상세 작업 내용**
- 파일: `server/tests/integration/todos.test.ts`
- 테스트 케이스:
  - GET /api/todos 인증 필요 (401)
  - GET /api/todos 본인 할일만 조회
  - GET /api/todos?categoryId= 필터링
  - GET /api/todos?isCompleted=true 필터링
  - POST /api/todos 성공 (201)
  - POST /api/todos 필수값 누락 (400)
  - PATCH /api/todos/:id 타인 할일 (403)
  - DELETE /api/todos/:id 성공 (204)
  - PATCH /api/todos/:id/complete 토글 (200)

**완료 조건**
- [ ] `todos.test.ts` 작성 완료
- [ ] 9개 테스트 케이스 모두 통과
- [ ] 필터 파라미터 테스트 포함
- [ ] 테스트 커버리지 80% 이상

**의존성**: BE-14 ~ BE-18, BE-20
**예상 소요 시간**: 80분

---

### BE-24 · 사용자 API 통합 테스트

**상세 작업 내용**
- 파일: `server/tests/integration/users.test.ts`
- 테스트 케이스:
  - GET /api/users/me 성공 (200)
  - GET /api/users/me 미인증 (401)
  - PATCH /api/users/me 이름 수정 (200)
  - PATCH /api/users/me 비밀번호 8자 미만 (400)
  - PATCH /api/users/me 이메일 수정 불가 확인
  - DELETE /api/users/me 탈퇴 (204)
  - DELETE /api/users/me 탈퇴 후 CASCADE DELETE 검증

**완료 조건**
- [ ] `users.test.ts` 작성 완료
- [ ] 7개 테스트 케이스 모두 통과
- [ ] 회원 탈퇴 후 CASCADE DELETE 동작 확인

**의존성**: BE-08, BE-09, BE-10, BE-20
**예상 소요 시간**: 60분

---

### BE-25 · 로그인 후 JWT 만료 시나리오 테스트

**상세 작업 내용**
- 만료된 JWT로 API 요청 → 401 Unauthorized 확인
- 유효하지 않은 서명의 JWT → 401 확인

**완료 조건**
- [ ] 만료 토큰 401 응답 확인
- [ ] 위조 토큰 401 응답 확인

**의존성**: BE-03, BE-07, BE-20
**예상 소요 시간**: 30분

---

### BE-26 · 전체 백엔드 빌드 및 스모크 테스트

**상세 작업 내용**
- `npm run build` (tsc 컴파일)
- `npm test` (전체 테스트)
- `npm run test:coverage` (커버리지 80% 이상 확인)

**완료 조건**
- [ ] `tsc --noEmit` 에러 0건
- [ ] `npm test` 전체 통과
- [ ] 테스트 커버리지 80% 이상
- [ ] `npm start` 서버 정상 시작 확인

**의존성**: BE-01 ~ BE-25
**예상 소요 시간**: 30분

---

## 3. 프론트엔드 (FE) Task

---

### FE-01 · 프로젝트 초기 셋업

**상세 작업 내용**
- `npm create vite@latest client -- --template react-ts`
- 의존성 설치: React 19, Zustand, TanStack Query v5, Axios, React Router
- 개발 의존성: Vitest, @testing-library/react, @testing-library/jest-dom
- `tsconfig.json` strict mode 활성화
- 디렉토리 구조: `client/src/{pages,components,hooks,stores,api,types,utils,styles}`
- `src/main.tsx` 작성

**완료 조건**
- [ ] `npm run dev` 정상 실행
- [ ] `tsc --noEmit` 에러 없음
- [ ] 필수 패키지 설치 완료
- [ ] 디렉토리 구조 완성

**의존성**: 없음
**예상 소요 시간**: 30분

---

### FE-02 · Axios 클라이언트 설정

**상세 작업 내용**
- 파일: `client/src/api/client.ts`
- `VITE_API_BASE_URL` 환경 변수 기반 baseURL 설정 (기본값: `http://localhost:3000`)
- 요청 인터셉터: `authStore.getState().accessToken` 읽어서 `Authorization: Bearer {token}` 자동 주입
- 응답 인터셉터: 401 → authStore 초기화 + `/login` 리다이렉트

**완료 조건**
- [ ] `client.ts` 작성 완료
- [ ] 요청 인터셉터 토큰 자동 주입 확인
- [ ] 401 에러 시 `/login` 리다이렉트 확인
- [ ] `.env.example` (`VITE_API_BASE_URL`) 작성

**의존성**: FE-01
**예상 소요 시간**: 60분

---

### FE-03 · Zustand authStore 구현

**상세 작업 내용**
- 파일: `client/src/stores/authStore.ts`
- 상태: `accessToken: string | null`, `user: User | null`
- 함수: `setAuth(token, user)`, `clearAuth()`, `isAuthenticated()`
- **메모리만 사용 — localStorage/Cookie 완전 금지**
- 페이지 새로고침 시 토큰 소멸 (의도된 동작)

**완료 조건**
- [ ] `authStore.ts` 작성 완료
- [ ] localStorage/sessionStorage/Cookie 미사용 확인
- [ ] `setAuth()`, `clearAuth()`, `isAuthenticated()` 동작 확인
- [ ] TypeScript 타입 안전성 확인

**의존성**: FE-01
**예상 소요 시간**: 45분

---

### FE-04 · TanStack Query 설정

**상세 작업 내용**
- 파일: `client/src/config/queryClient.ts`
- QueryClient 인스턴스 생성 (retry: 1, staleTime: 5분)
- `client/src/main.tsx`에 `QueryClientProvider` 래핑

**완료 조건**
- [ ] `queryClient.ts` 생성 완료
- [ ] `main.tsx`에 QueryClientProvider 적용

**의존성**: FE-01, FE-02
**예상 소요 시간**: 30분

---

### FE-05 · 공통 UI 컴포넌트

**상세 작업 내용**
- `client/src/components/common/Button.tsx` — variant: primary/secondary/danger
- `client/src/components/common/Input.tsx` — 라벨, 에러 메시지 포함
- `client/src/components/common/Modal.tsx` — isOpen 제어, 배경 클릭 닫기
- `client/src/components/common/Spinner.tsx` — CSS 로딩 스피너
- `client/src/components/common/ErrorMessage.tsx` — 에러 알림

**완료 조건**
- [ ] Button 컴포넌트 3개 variant 구현 및 스타일 확인
- [ ] Input 컴포넌트 에러 메시지 표시 확인
- [ ] Modal 컴포넌트 isOpen 제어 확인
- [ ] Spinner, ErrorMessage 컴포넌트 렌더링 확인

**의존성**: FE-01
**예상 소요 시간**: 120분

---

### FE-06 · 반응형 CSS 시스템

**상세 작업 내용**
- 파일: `client/src/styles/globals.css`
- CSS 변수: 색상, 간격, 폰트, border-radius, shadow
- Breakpoint: Mobile(≤768px), Tablet(769~1024px), Desktop(≥1025px)
- Reset CSS, 기본 폰트 설정

**완료 조건**
- [ ] CSS 변수 정의 완료
- [ ] 3개 Breakpoint 미디어 쿼리 정의
- [ ] 모든 화면에서 레이아웃 깨짐 없음

**의존성**: FE-01
**예상 소요 시간**: 90분

---

### FE-07 · 인증 API 및 Hook

**상세 작업 내용**
- `client/src/api/authApi.ts`: `register()`, `login()`
- `client/src/hooks/auth/useRegister.ts`: TanStack Query useMutation
- `client/src/hooks/auth/useLogin.ts`: 성공 시 authStore 저장 + `/todos` 리다이렉트
- `client/src/types/auth.types.ts`: `RegisterInput`, `LoginInput`, `AuthResponse`

**완료 조건**
- [ ] `authApi.ts` register/login 함수 구현
- [ ] `useRegister`, `useLogin` 훅 구현
- [ ] 로그인 성공 시 authStore 저장 및 `/todos` 이동 확인
- [ ] 409 (중복 이메일), 401 (잘못된 자격증명) 에러 처리 확인

**의존성**: FE-02, FE-03, FE-04
**예상 소요 시간**: 60분

---

### FE-08 · SCR-01 회원가입 화면

**상세 작업 내용**
- 파일: `client/src/pages/auth/RegisterPage.tsx`
- Input 3개: 이메일, 비밀번호, 이름
- 로컬 유효성: 이메일 정규식, 비밀번호 최소 8자
- useRegister 훅 연동
- "이미 계정이 있으신가요? 로그인" 링크

**완료 조건**
- [ ] 3개 Input 필드 렌더링
- [ ] 로컬 유효성 검사 동작 확인
- [ ] useRegister 성공/실패 처리 확인
- [ ] 로딩 중 버튼 disabled
- [ ] Mobile/Tablet/Desktop 반응형 확인

**의존성**: FE-05, FE-07
**예상 소요 시간**: 90분

---

### FE-09 · SCR-02 로그인 화면

**상세 작업 내용**
- 파일: `client/src/pages/auth/LoginPage.tsx`
- Input 2개: 이메일, 비밀번호
- useLogin 훅 연동
- 401 에러 메시지: "이메일 또는 비밀번호가 올바르지 않습니다"
- "계정이 없으신가요? 가입하기" 링크

**완료 조건**
- [ ] 2개 Input 필드 렌더링
- [ ] useLogin 성공/실패 처리 확인
- [ ] 로딩 중 버튼 disabled
- [ ] Mobile/Tablet/Desktop 반응형 확인

**의존성**: FE-05, FE-07
**예상 소요 시간**: 90분

---

### FE-10 · 라우팅 및 인증 가드

**상세 작업 내용**
- `client/src/config/router.tsx`: 라우트 정의
- `client/src/components/layout/PrivateRoute.tsx`: `isAuthenticated()` 확인, false → `/login` 리다이렉트
- `client/src/components/layout/Header.tsx`: 네비게이션, 로그아웃 버튼
- 라우트: `/login`, `/register`, `/todos`, `/categories`, `/profile`
- `main.tsx`에 BrowserRouter 통합

**완료 조건**
- [ ] PrivateRoute 인증 가드 동작 확인
- [ ] 미인증 상태에서 `/todos` 접근 시 `/login` 리다이렉트
- [ ] Header 로그아웃 (authStore.clearAuth() + `/login` 이동) 확인
- [ ] 모든 라우트 접근 가능 확인

**의존성**: FE-03, FE-08, FE-09
**예상 소요 시간**: 90분

---

### FE-11 · 할일 API 및 Hook

**상세 작업 내용**
- `client/src/api/todoApi.ts`: `getTodos(filters)`, `createTodo()`, `updateTodo()`, `deleteTodo()`, `completeTodo()`
- `client/src/hooks/todos/useTodos.ts`: useQuery, key `['todos', filters]`
- `client/src/hooks/todos/useCreateTodo.ts`: useMutation + invalidate `['todos']`
- `client/src/hooks/todos/useUpdateTodo.ts`
- `client/src/hooks/todos/useDeleteTodo.ts`
- `client/src/hooks/todos/useCompleteTodo.ts`
- `client/src/stores/todoFilterStore.ts`: Zustand 필터 상태

**완료 조건**
- [ ] todoApi.ts 5개 함수 구현
- [ ] 5개 훅 작성 완료 (useQuery/useMutation 사용 확인)
- [ ] 뮤테이션 성공 시 쿼리 무효화 동작 확인
- [ ] todoFilterStore 구현 완료

**의존성**: FE-02, FE-04
**예상 소요 시간**: 150분

---

### FE-12 · 카테고리 API 및 Hook

**상세 작업 내용**
- `client/src/api/categoryApi.ts`: `getCategories()`, `createCategory()`, `deleteCategory()`
- `client/src/hooks/categories/useCategories.ts`
- `client/src/hooks/categories/useCreateCategory.ts`
- `client/src/hooks/categories/useDeleteCategory.ts`: 409, 403 에러 처리

**완료 조건**
- [ ] categoryApi.ts 3개 함수 구현
- [ ] 3개 훅 작성 완료
- [ ] 409 Conflict (할일 연결됨), 403 Forbidden (기본 카테고리) 에러 처리 확인

**의존성**: FE-02, FE-04
**예상 소요 시간**: 60분

---

### FE-13 · 사용자 API 및 Hook

**상세 작업 내용**
- `client/src/api/userApi.ts`: `getMe()`, `updateMe()`, `deleteMe()`
- `client/src/hooks/users/useMe.ts`: useQuery, key `['me']`
- `client/src/hooks/users/useUpdateMe.ts`
- `client/src/hooks/users/useDeleteMe.ts`: 성공 시 authStore 초기화 + `/login` 이동

**완료 조건**
- [ ] userApi.ts 3개 함수 구현
- [ ] 3개 훅 작성 완료
- [ ] 회원 탈퇴 후 authStore 초기화 및 `/login` 리다이렉트 확인

**의존성**: FE-02, FE-03, FE-04
**예상 소요 시간**: 90분

---

### FE-14 · 할일 컴포넌트 (Card, Form, List)

**상세 작업 내용**
- `client/src/components/todos/TodoCard.tsx`
  - 완료 체크박스, 제목(완료 시 strikethrough), 설명, 마감일, 카테고리 배지, 수정/삭제 버튼
- `client/src/components/todos/TodoList.tsx`
  - TodoCard 반복 렌더링, 할일 없음 메시지, 반응형 그리드
- `client/src/components/todos/TodoForm.tsx`
  - Modal 래핑, 제목(필수)/설명/마감일/카테고리(필수) 입력
  - 등록/수정 모드 전환 (initialData prop)
- `client/src/components/todos/TodoFilter.tsx`
  - 카테고리 드롭다운, 날짜 범위, 완료 여부 라디오, 적용/초기화 버튼

**완료 조건**
- [ ] TodoCard 4개 필드(제목, 마감일, 카테고리, 완료) 렌더링 확인
- [ ] TodoList 반응형 그리드 (Desktop 2열, Mobile 1열) 확인
- [ ] TodoForm 등록/수정 모드 전환 확인
- [ ] TodoFilter 4개 필터 요소 동작 확인

**의존성**: FE-05, FE-11, FE-12
**예상 소요 시간**: 180분

---

### FE-15 · SCR-03 할일 목록 화면

**상세 작업 내용**
- 파일: `client/src/pages/todos/TodoListPage.tsx`
- TodoFilter + TodoList + "새 할일 추가" 버튼 + TodoForm 모달
- useTodos 필터 연동, useCreateTodo/useUpdateTodo/useDeleteTodo 연동
- 로딩 시 Spinner, 에러 시 ErrorMessage

**완료 조건**
- [ ] `TodoListPage.tsx` 작성 완료
- [ ] 필터 UI 표시 및 동작 확인
- [ ] 할일 등록/수정/삭제 기능 동작 확인
- [ ] 로딩/에러 상태 처리 확인
- [ ] Mobile/Tablet/Desktop 반응형 확인

**의존성**: FE-11, FE-14
**예상 소요 시간**: 150분

---

### FE-16 · SCR-04 할일 완료 토글 (TodoCard 통합)

**상세 작업 내용**
- TodoCard 체크박스 클릭 시 `useCompleteTodo` 호출
- 성공 시 목록 자동 갱신 (TanStack Query 무효화)

**완료 조건**
- [ ] 체크박스 클릭 → useCompleteTodo 호출 확인
- [ ] 완료 상태 시각적 표현(strikethrough, opacity) 즉시 반영 확인

**의존성**: FE-15
**예상 소요 시간**: 30분

---

### FE-17 · SCR-05 카테고리 관리 화면

**상세 작업 내용**
- 파일: `client/src/pages/categories/CategoryPage.tsx`
- 카테고리 추가 폼, 카테고리 목록 (기본 배지 표시, 사용자 정의 삭제 버튼)
- 409 (할일 연결됨): "해당 카테고리에 연결된 할일이 있어 삭제할 수 없습니다"
- 403 (기본 카테고리): "기본 카테고리는 삭제할 수 없습니다"

**완료 조건**
- [ ] `CategoryPage.tsx` 작성 완료
- [ ] 기본/사용자 정의 카테고리 구분 표시
- [ ] 카테고리 추가/삭제 기능 동작 확인
- [ ] 에러 처리(409, 403) 메시지 표시 확인

**의존성**: FE-05, FE-12
**예상 소요 시간**: 120분

---

### FE-18 · SCR-06 내 정보 수정 화면

**상세 작업 내용**
- 파일: `client/src/pages/users/ProfilePage.tsx`
- 이메일(읽기 전용), 이름 수정, 비밀번호 변경
- 비밀번호 최소 8자 로컬 검증
- "회원 탈퇴" 버튼 → 확인 대화상자 → useDeleteMe 호출

**완료 조건**
- [ ] `ProfilePage.tsx` 작성 완료
- [ ] 이메일 읽기 전용 확인
- [ ] 비밀번호 최소 8자 검증 확인
- [ ] 회원 탈퇴 확인 대화상자 동작 확인
- [ ] 탈퇴 후 authStore 초기화 및 `/login` 이동 확인

**의존성**: FE-05, FE-13
**예상 소요 시간**: 120분

---

### FE-19 · 환경 변수 설정

**상세 작업 내용**
- `client/.env.example`: `VITE_API_BASE_URL=http://localhost:3000`
- `client/.env` (개발), `client/.env.production` (운영) 작성
- `src/api/client.ts`에서 `import.meta.env.VITE_API_BASE_URL` 사용

**완료 조건**
- [ ] `.env.example` 작성 및 키 명시
- [ ] `import.meta.env` 사용 확인
- [ ] `.env`를 `.gitignore`에 추가 확인

**의존성**: FE-01, FE-02
**예상 소요 시간**: 30분

---

### FE-20 · Vitest + React Testing Library 설정

**상세 작업 내용**
- `vite.config.ts` 수정: test environment jsdom, globals true, setupFiles
- `client/tests/setup.ts` 작성
- package.json: `test`, `test:ui`, `test:coverage` 스크립트
- 의존성: `@vitest/ui`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`

**완료 조건**
- [ ] Vitest 설정 완료
- [ ] `npm run test` 실행 가능 확인

**의존성**: FE-01
**예상 소요 시간**: 60분

---

### FE-21 · Button/Input 컴포넌트 테스트

**상세 작업 내용**
- `client/tests/components/Button.test.tsx`
  - 렌더링, onClick, disabled, variant, children 테스트
- `client/tests/components/Input.test.tsx`
  - 렌더링, onChange, value, error 메시지, required 테스트

**완료 조건**
- [ ] Button 5개 테스트 케이스 통과
- [ ] Input 5개 테스트 케이스 통과

**의존성**: FE-05, FE-20
**예상 소요 시간**: 90분

---

### FE-22 · TodoCard 컴포넌트 테스트

**상세 작업 내용**
- 파일: `client/tests/components/TodoCard.test.tsx`
- 샘플 Todo 객체 사용
- 렌더링, isCompleted strikethrough, onEdit/onDelete 콜백, 설명 없음 처리 테스트

**완료 조건**
- [ ] 5개 테스트 케이스 통과

**의존성**: FE-14, FE-20
**예상 소요 시간**: 60분

---

### FE-23 · useTodos Hook 테스트

**상세 작업 내용**
- 파일: `client/tests/hooks/useTodos.test.ts`
- API 응답 mock (vi.mock)
- 할일 목록 반환, 필터 변경 시 재페칭, 로딩/에러 상태 테스트

**완료 조건**
- [ ] 5개 테스트 케이스 통과
- [ ] Mock API 설정 정상 동작

**의존성**: FE-11, FE-20
**예상 소요 시간**: 90분

---

### FE-24 · LoginPage 통합 테스트

**상세 작업 내용**
- 파일: `client/tests/pages/LoginPage.test.tsx`
- 렌더링, 폼 제출, 유효성 에러, 로그인 성공 리다이렉트, 401 에러 메시지 테스트

**완료 조건**
- [ ] 5개 테스트 케이스 통과

**의존성**: FE-09, FE-20
**예상 소요 시간**: 90분

---

### FE-25 · 주요 시나리오 통합 테스트

**상세 작업 내용**
- `client/tests/integration/auth.test.ts`: SCN-01(회원가입), SCN-02(로그인), SCN-16(JWT 만료)
- `client/tests/integration/todos.test.ts`: SCN-04~08 (CRUD + 필터)
- `client/tests/integration/categories.test.ts`: SCN-09~10, SCN-22 (409 에러)

**완료 조건**
- [ ] 3개 통합 테스트 파일 작성 완료
- [ ] 9개 시나리오 테스트 케이스 통과
- [ ] Mock API 설정 및 에러 처리 확인

**의존성**: FE-07, FE-09, FE-15, FE-17, FE-18, FE-20
**예상 소요 시간**: 180분

---

### FE-26 · 프로덕션 빌드 및 최종 QA

**상세 작업 내용**
- `npm run build` (tsc --noEmit + vite build)
- `npm run preview`로 번들 로컬 확인
- 수동 QA 체크리스트 (13개 항목)

**완료 조건**
- [ ] 회원가입 → 로그인 → 할일 목록 이동 정상
- [ ] 할일 등록/수정/삭제/완료 토글 정상
- [ ] 필터 (카테고리, 기간, 완료 여부) 정상 동작
- [ ] 카테고리 추가/삭제 정상 동작
- [ ] 프로필 수정 및 회원 탈퇴 정상 동작
- [ ] 로그아웃 및 재로그인 정상
- [ ] 페이지 새로고침 후 토큰 소멸 및 로그인 화면 이동
- [ ] 401 에러 시 자동 로그인 페이지 리다이렉트
- [ ] Mobile/Tablet/Desktop 반응형 확인
- [ ] `tsc --noEmit` 에러 0건
- [ ] `npm test` 전체 통과
- [ ] 테스트 커버리지 80% 이상
- [ ] `npm run build` 성공

**의존성**: 모든 FE Task
**예상 소요 시간**: 120분

---

## 4. 전체 의존성 및 실행 순서

```
[Day 1]
DB-01 → DB-02 → DB-03
DB-01 → DB-04 → DB-05 → DB-06

BE-01 → BE-02, BE-03, BE-04, BE-05 (병렬)
BE-06 (회원가입) → BE-07 (로그인)
DB-06 + BE-01 → BE-06, BE-07

[Day 2]
BE-08 (내 정보 조회) → BE-09 (수정) → BE-10 (탈퇴)
BE-11 (카테고리 조회) → BE-12 (생성) → BE-13 (삭제)
BE-14 (할일 조회) → BE-15 (등록) → BE-16 (수정)
BE-17 (삭제) ← BE-14
BE-18 (완료 토글) ← BE-14
BE-19 (앱 초기화) ← 모든 API
BE-20 → BE-21, BE-22, BE-23, BE-24, BE-25 (병렬) → BE-26

[Day 3]
FE-01 → FE-02, FE-03, FE-05, FE-06, FE-20 (병렬)
FE-02 + FE-03 + FE-04 → FE-07
FE-07 + FE-05 → FE-08, FE-09
FE-08 + FE-09 + FE-03 → FE-10 (라우팅)
FE-02 + FE-04 → FE-11 (할일), FE-12 (카테고리), FE-13 (사용자)
FE-11 + FE-12 + FE-05 → FE-14 (컴포넌트)
FE-14 + FE-11 → FE-15 (할일 목록 화면) → FE-16 (완료 토글)
FE-12 + FE-05 → FE-17 (카테고리 화면)
FE-13 + FE-05 → FE-18 (프로필 화면)
FE-19 (환경 변수) ← FE-01, FE-02
FE-20 → FE-21, FE-22, FE-23, FE-24, FE-25 (병렬)
모든 FE → FE-26 (빌드/QA)
```

---

## 5. 비즈니스 규칙 → Task 매핑

| 비즈니스 규칙 | 구현 Task |
|-------------|-----------|
| BR-03 (본인 할일만 접근) | BE-14, BE-16, BE-17, BE-18 (Service 소유권 검증) |
| BR-04 (할일 등록 시 카테고리 필수) | BE-15 (Controller/DB NOT NULL) |
| BR-05 (description, dueDate 선택) | DB-02 (NULL 허용 컬럼), BE-15 |
| BR-06 (완료 상태 취소 가능) | BE-18 (토글 로직) |
| BR-07 (기본 카테고리 user_id=NULL) | DB-03 (Seed 데이터) |
| BR-09 (사용자 정의 카테고리 본인만 접근) | BE-11, BE-12, FE-12 |
| BR-10 (할일 연결 카테고리 삭제 차단) | DB-02 (RESTRICT FK), BE-13, FE-17 |
| BR-12 (이메일 변경 불가) | BE-09 (Controller), FE-18 (읽기 전용) |
| UC-11 (회원 탈퇴 CASCADE DELETE) | DB-02 (CASCADE FK), BE-10 |
