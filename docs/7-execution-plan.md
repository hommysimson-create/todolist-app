# TodoListApp 실행계획

- 버전: 1.0.2
- 작성일: 2026-05-13
- 참조 문서:
  - `2-prd.md` — 기능 요구사항 및 API 목록
  - `4-project-principles.md` — 레이어 구조 및 의존성 원칙
  - `5-arch-diagram.md` — 기술 아키텍처 다이어그램
  - `6-erd.md` — ERD 및 테이블 정의
  - `database/schema.sql` — DDL 스크립트

---

## 변경 이력

| 버전  | 변경일     | 변경 내용                                                                  | 변경자   |
| ----- | ---------- | -------------------------------------------------------------------------- | -------- |
| 1.0.2 | 2026-05-13 | 백엔드 TypeScript → JavaScript로 변경: .ts→.js, types/ 제거, tsconfig 제거 | aliceKim |
| 1.0.1 | 2026-05-13 | DB-01 Docker → 로컬 직접 설치 방식으로 변경                                | aliceKim |
| 1.0.0 | 2026-05-13 | 최초 작성                                                                  | aliceKim |

---

## 개요

### 개발 일정 (3일)

| 일차  | 주요 작업                                                                    |
| ----- | ---------------------------------------------------------------------------- |
| Day 1 | DB 환경 구성, 백엔드 프로젝트 셋업, 인증 API (회원가입·로그인), JWT 미들웨어 |
| Day 2 | 할일 CRUD API, 카테고리 API, 사용자 정보 수정·탈퇴 API, 백엔드 테스트        |
| Day 3 | 프론트엔드 전체 화면 구현 (SCR-01~06), 통합 테스트 및 버그 수정              |

### Task 분류

| 레이어            | Task 수  | 예상 시간     |
| ----------------- | -------- | ------------- |
| 데이터베이스 (DB) | 6개      | 2시간         |
| 백엔드 (BE)       | 26개     | 20시간        |
| 프론트엔드 (FE)   | 35개     | 45시간        |
| **합계**          | **67개** | **약 67시간** |

---

## 1. 데이터베이스 (DB) Task

---

### DB-01 · PostgreSQL 17 환경 구성

> **변경 사항 (v1.0.1)**: Docker 대신 로컬 머신에 PostgreSQL 17을 직접 설치한 환경을 사용한다.
> 연결 문자열: `postgresql://postgres:postgres@localhost:5432/postgres`

**상세 작업 내용**

- 로컬 설치된 PostgreSQL 17 서비스 기동 확인 (Windows 서비스: `postgresql-x64-17`)
- `todolist_dev` 데이터베이스 생성: `CREATE DATABASE todolist_dev;`
- `.env` 작성 (프로젝트 루트 및 `backend/`):
  - `DB_HOST=localhost`
  - `DB_PORT=5432`
  - `DB_NAME=todolist_dev`
  - `DB_USER=postgres`
  - `DB_PASSWORD=postgres`
- `.env.example` 작성: 위 키 목록 (값은 빈 문자열로)

**완료 조건**

- [x] 로컬 PostgreSQL 17 서비스 실행 중 확인 (`SELECT version()` → PostgreSQL 17.x)
- [x] `todolist_dev` 데이터베이스 생성 완료
- [x] `.env` 및 `.env.example` 작성 완료
- [x] `.env`를 `.gitignore`에 추가 확인

**의존성**: 없음
**예상 소요 시간**: 10분

---

### DB-02 · DDL 스크립트 실행

**상세 작업 내용**

- `database/schema.sql` 실행 (로컬 psql 사용):
  ```powershell
  psql -U postgres -h localhost -d todolist_dev -f database/schema.sql
  ```
- pgcrypto 확장 활성화 확인 (`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)
- 테이블 3개 생성 확인 (users, categories, todos)
- 제약 조건 확인: PK, FK(CASCADE/RESTRICT), UNIQUE, CHECK

**완료 조건**

- [x] `SELECT extname FROM pg_extension WHERE extname='pgcrypto'` → 결과 확인
- [x] users 테이블: 6개 컬럼 + UNIQUE(email)
- [x] categories 테이블: 5개 컬럼 + FK CASCADE + CHECK(is_default→user_id IS NULL)
- [x] todos 테이블: 9개 컬럼 + FK CASCADE(users) + FK RESTRICT(categories)
- [x] 인덱스 5개 생성 확인

**의존성**: DB-01
**예상 소요 시간**: 10분

---

### DB-03 · 기본 카테고리 Seed 데이터 확인

**상세 작업 내용**

- schema.sql에 포함된 SEED INSERT 실행 확인
  - 업무, 개인, 쇼핑, 건강, 학습 (user_id=NULL, is_default=true)
- 삽입 결과 검증

**완료 조건**

- [x] `SELECT COUNT(*) FROM categories WHERE is_default=true` → 5
- [x] 각 카테고리 `is_default=true`, `user_id=NULL` 확인
- [x] 카테고리명 5개(업무, 개인, 쇼핑, 건강, 학습) 정확성 확인

**의존성**: DB-02
**예상 소요 시간**: 5분

---

### DB-04 · 개발/테스트 DB 분리

**상세 작업 내용**

- 개발 DB: `todolist_dev` (DB-01에서 생성), 테스트 DB: `todolist_test`
- 로컬 psql로 테스트 DB 생성:
  ```powershell
  psql -U postgres -h localhost -c "CREATE DATABASE todolist_test;"
  psql -U postgres -h localhost -d todolist_test -f database/schema.sql
  ```
- `NODE_ENV=test`일 때 `DB_NAME=todolist_test`로 분기
- 테스트 실행 전 테이블 초기화 (`TRUNCATE`) 스크립트 작성

**완료 조건**

- [x] `todolist_test` DB 생성 및 스키마 적용 완료
- [x] `NODE_ENV` 기반 DB_NAME 분기 로직 작성
- [x] 테스트 실행 전 테이블 초기화 (`TRUNCATE`) 스크립트 작성

**의존성**: DB-01, DB-02
**예상 소요 시간**: 20분

---

### DB-05 · pg Pool 연결 설정

**상세 작업 내용**

- 파일: `backend/src/db/pool.js`
- `pg.Pool` 싱글톤 생성, 환경 변수 기반 설정
- `DB_PASSWORD` 누락 시 프로세스 종료 처리

```javascript
// backend/src/db/pool.js
const { Pool } = require("pg");

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

module.exports = pool;
```

**완료 조건**

- [x] `backend/src/db/pool.js` 생성 완료
- [x] 필수 환경 변수 `.env.example`에 문서화
- [x] `pool.query('SELECT 1')` 연결 성공 확인

**의존성**: DB-02, DB-04
**예상 소요 시간**: 25분

---

### DB-06 · Repository 레이어 기본 구조

**상세 작업 내용**

- `backend/src/repositories/userRepository.js`
- `backend/src/repositories/categoryRepository.js`
- `backend/src/repositories/todoRepository.js`
- ORM 금지: 모든 쿼리는 pg 파라미터화 쿼리(`$1, $2, ...`) 사용
- DB 에러는 Repository에서 catch하지 않고 Service로 전파

**완료 조건**

- [x] 3개 Repository 파일 생성 완료
- [x] 모든 SQL 쿼리 파라미터화 확인 (문자열 동적 연결 금지)
- [x] userRepository: `findByEmail`, `findById`, `create`, `update`, `delete` 최소 5개 함수
- [x] categoryRepository: `findByUserIdAndDefault`, `findById`, `create`, `delete` 최소 4개 함수
- [x] todoRepository: `findByUserIdWithFilter`, `findById`, `create`, `update`, `delete`, `updateCompleted` 최소 6개 함수

**의존성**: DB-02, DB-05
**예상 소요 시간**: 45분

---

## 2. 백엔드 (BE) Task

---

### BE-01 · 프로젝트 초기 셋업

**상세 작업 내용**

- `backend/` 디렉토리 및 `package.json` 작성 (`"type": "commonjs"`)
- 의존성 설치: `express`, `pg`, `jsonwebtoken`, `bcrypt`, `dotenv`
- 개발 의존성: `jest`, `supertest`, `nodemon`
- 디렉토리 구조: `backend/src/{routes,controllers,services,repositories,middlewares,db,utils}`
- `jest.config.js` 작성 (testEnvironment: node)

**완료 조건**

- [x] `backend/package.json` 및 `node_modules` 설치 완료
- [x] 전체 디렉토리 구조 생성 완료
- [x] `.env.example` 작성 (`NODE_ENV`, `PORT`, `DB_HOST/PORT/NAME/USER/PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN=1h`)

**의존성**: 없음
**예상 소요 시간**: 30분

---

### BE-02 · 에러 핸들링 미들웨어

**상세 작업 내용**

- 파일: `backend/src/middlewares/errorHandler.js`
- HTTP 상태 코드별 JSON 표준 응답: `{ status, message }`
- 400, 401, 403, 404, 409, 500 처리
- 스택 트레이스는 로그에만 기록, 응답에 미포함 (운영 환경)

**완료 조건**

- [x] `errorHandler.js` 작성 완료
- [x] 6개 HTTP 상태 코드 모두 처리
- [x] 500 에러 시 클라이언트에 상세 정보 미노출 확인

**의존성**: BE-01
**예상 소요 시간**: 30분

---

### BE-03 · JWT 유틸 및 인증 미들웨어

**상세 작업 내용**

- 파일: `backend/src/utils/jwt.js`
  - `sign(payload)` → token (만료: 1h, `JWT_SECRET` 사용)
  - `verify(token)` → payload 또는 에러 throw
- 파일: `backend/src/middlewares/authenticate.js`
  - `Authorization: Bearer {token}` 헤더에서 토큰 추출
  - 검증 성공 시 `req.user` 주입 (`userId`, `email`)
  - 검증 실패/만료 시 401 응답

**완료 조건**

- [x] `jwt.js` sign/verify 함수 구현
- [x] `authenticate.js` 미들웨어 작성
- [x] JWT 만료 시간 1h 명시
- [x] 만료 토큰 사용 시 401 응답 확인

**의존성**: BE-01
**예상 소요 시간**: 40분

---

### BE-04 · bcrypt 유틸 함수

**상세 작업 내용**

- 파일: `backend/src/utils/hash.js`
  - `hashPassword(plainPassword)` → bcrypt 해시 (saltRounds: 12)
  - `comparePassword(plain, hashed)` → boolean
- 평문 비밀번호 로그 출력 금지

**완료 조건**

- [x] `hash.js` 작성 완료
- [x] bcrypt saltRounds: 12 명시
- [x] 평문 비밀번호 로그 미포함

**의존성**: BE-01
**예상 소요 시간**: 20분

---

### BE-05 · 입력값 검증 유틸

**상세 작업 내용**

- 파일: `backend/src/utils/validate.js`
  - `isValidEmail(email)` — RFC 5322 정규식
  - `isValidPassword(password)` — 최소 8자
  - `isValidUUID(uuid)`
  - `isValidDate(dateString)` — YYYY-MM-DD
  - `isValidName(name)` — 1~100자
  - `isValidTitle(title)` — 1~255자

**완료 조건**

- [x] `validate.js` 작성 완료
- [x] 6개 검증 함수 구현 및 module.exports

**의존성**: BE-01
**예상 소요 시간**: 30분

---

### BE-06 · 회원가입 API (UC-01)

**상세 작업 내용**

- `backend/src/routes/authRoutes.js`: `POST /api/auth/register`
- Controller: 이메일 형식, 비밀번호 최소 8자, 이름 필수 검증 → 실패 시 400
- Service: 이메일 중복 확인 → 409, bcrypt 해시 후 저장
- Repository: `INSERT INTO users ...`
- 응답: 201 Created (비밀번호 미포함)

**완료 조건**

- [x] Route → Controller → Service → Repository 4개 레이어 구현
- [x] 비밀번호 최소 8자 검증 (Controller 레이어)
- [x] 중복 이메일 409 Conflict 응답 확인
- [x] 응답 본문에 password 미포함 확인

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

- [x] Route → Controller → Service → Repository 4개 레이어 구현
- [x] JWT 만료 시간 1h 명시
- [x] 잘못된 자격증명 시 401 응답 확인
- [x] 응답 본문에 password 미포함 확인

**의존성**: BE-01, BE-02, BE-03, BE-04, BE-05, BE-06, DB-06
**예상 소요 시간**: 50분

---

### BE-08 · 내 정보 조회 API

**상세 작업 내용**

- `GET /api/users/me` (인증 필요)
- `backend/src/routes/userRoutes.js` 생성
- Service: `findById(userId)` 조회
- 응답: 200 OK + `{ id, email, name, createdAt }` (password 제외)

**완료 조건**

- [x] Route → Controller → Service → Repository 구현
- [x] authenticate 미들웨어 적용 확인
- [x] 응답에 password 미포함 확인

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

- [x] Route → Controller → Service → Repository 구현
- [x] 비밀번호 최소 8자 검증 (Controller 레이어)
- [x] 이메일 수정 불가 확인 (BR-12)
- [x] 응답에 password 미포함 확인

**의존성**: BE-01, BE-02, BE-03, BE-04, BE-05, BE-08, DB-06
**예상 소요 시간**: 45분

---

### BE-10 · 회원 탈퇴 API (UC-11)

**상세 작업 내용**

- `DELETE /api/users/me` (인증 필요)
- Service: `DELETE FROM users WHERE id = $1` (CASCADE DELETE로 todos, categories 자동 삭제)
- 응답: 204 No Content

**완료 조건**

- [x] Route → Controller → Service → Repository 구현
- [x] 204 No Content 응답 확인
- [x] DB CASCADE DELETE 동작 확인 (users 삭제 → todos, categories 삭제)

**의존성**: BE-01, BE-02, BE-03, BE-08, DB-06
**예상 소요 시간**: 45분

---

### BE-11 · 카테고리 목록 조회 API

**상세 작업 내용**

- `GET /api/categories` (인증 필요)
- `backend/src/routes/categoryRoutes.js` 생성
- Repository SQL: `SELECT ... FROM categories WHERE is_default=true OR user_id=$1 ORDER BY is_default DESC, name ASC`
- 응답: 기본 카테고리 전체 + 요청자의 사용자 정의 카테고리 (BR-09)

**완료 조건**

- [x] Route → Controller → Service → Repository 구현
- [x] 기본 카테고리 + 사용자 정의 카테고리 함께 반환 확인
- [x] 타인의 사용자 정의 카테고리 미포함 확인 (BR-09)

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

- [x] Route → Controller → Service → Repository 구현
- [x] 동일 사용자 중복 카테고리명 409 Conflict 확인
- [x] is_default=false, user_id=요청자 ID 저장 확인

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

- [x] Route → Controller → Service → Repository 구현
- [x] 기본 카테고리 삭제 시도 403 Forbidden 확인
- [x] 할일 연결된 카테고리 삭제 409 Conflict 확인 (BR-10)
- [x] 타인 카테고리 403 Forbidden 확인

**의존성**: BE-01, BE-02, BE-03, BE-11, DB-06
**예상 소요 시간**: 50분

---

### BE-14 · 할일 목록 조회 API (UC-08)

**상세 작업 내용**

- `GET /api/todos?categoryId=&startDate=&endDate=&isCompleted=` (인증 필요)
- `backend/src/routes/todoRoutes.js` 생성
- Controller: 쿼리 파라미터 파싱 및 유효성 검증
- Service: 본인 할일만 조회 (BR-03)
- Repository: 동적 필터 쿼리, 기본 정렬 `ORDER BY created_at DESC`

**완료 조건**

- [x] Route → Controller → Service → Repository 구현
- [x] 4개 필터 파라미터(categoryId, startDate, endDate, isCompleted) 동작 확인
- [x] 등록일 내림차순 기본 정렬 확인
- [x] 본인 할일만 조회 확인 (BR-03)

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

- [x] Route → Controller → Service → Repository 구현
- [x] title, categoryId 필수 검증 → 400 확인
- [x] 존재하지 않는 categoryId → 400 확인
- [x] is_completed=false 초기값 확인

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

- [x] Route → Controller → Service → Repository 구현
- [x] 존재하지 않는 할일 404 Not Found 확인
- [x] 타인 할일 수정 시도 403 Forbidden 확인

**의존성**: BE-01, BE-02, BE-03, BE-05, BE-14, DB-06
**예상 소요 시간**: 50분

---

### BE-17 · 할일 삭제 API (UC-06)

**상세 작업 내용**

- `DELETE /api/todos/:id` (인증 필요)
- Service: 존재 확인 → 404, 소유권 확인 → 403
- 응답: 204 No Content

**완료 조건**

- [x] Route → Controller → Service → Repository 구현
- [x] 존재하지 않는 할일 404 Not Found 확인
- [x] 타인 할일 삭제 시도 403 Forbidden 확인

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

- [x] Route → Controller → Service → Repository 구현
- [x] is_completed 토글 (true↔false) 동작 확인
- [x] 타인 할일 403 Forbidden 확인

**의존성**: BE-01, BE-02, BE-03, BE-14, DB-06
**예상 소요 시간**: 40분

---

### BE-19 · Express 앱 초기화 및 라우터 등록

**상세 작업 내용**

- 파일: `backend/app.js`
- 미들웨어 등록 순서: `express.json()` → 요청 로깅(인라인) → CORS(인라인) → Swagger UI → 라우터 → 404 핸들러 → errorHandler
- 라우터 등록: `/api/auth`, `/api/users`, `/api/todos`, `/api/categories`
- Swagger UI: `swagger-ui-express` 패키지 사용, `/api-docs` 경로에 마운트 (`swagger/swagger.json` 사용)
- 요청 로깅: `res.on('finish')` 콜백으로 `[REQ] METHOD URL → STATUS (Xms)` 형식 기록 (NODE_ENV=test 제외)
- PORT 환경 변수 기반 서버 시작 (기본값: 3000)

**완료 조건**

- [x] `app.js` 작성 완료
- [x] 4개 라우터 등록 확인
- [x] errorHandler 마지막 등록 확인
- [x] `node app.js` 서버 정상 시작 확인
- [x] Swagger UI `http://localhost:3000/api-docs` 접근 확인

**의존성**: BE-02, BE-03, BE-06 ~ BE-18
**예상 소요 시간**: 30분

---

### BE-20 · Jest + Supertest 테스트 환경 설정

**상세 작업 내용**

- `jest.config.js` 작성: testEnvironment node
- 디렉토리 구조: `backend/tests/unit/`, `backend/tests/integration/`
- package.json 스크립트: `test`, `test:watch`, `test:coverage`

**완료 조건**

- [x] `jest.config.js` 작성 완료
- [x] `npm test` 실행 가능 확인

**의존성**: BE-01
**예상 소요 시간**: 30분

---

### BE-21 · 인증 API 통합 테스트

**상세 작업 내용**

- 파일: `backend/tests/integration/auth.test.js`
- 테스트 케이스:
  - POST /api/auth/register 성공 (201)
  - POST /api/auth/register 중복 이메일 (409)
  - POST /api/auth/register 비밀번호 8자 미만 (400)
  - POST /api/auth/login 성공 (200 + accessToken)
  - POST /api/auth/login 잘못된 비밀번호 (401)

**완료 조건**

- [x] `auth.test.js` 작성 완료
- [x] 5개 테스트 케이스 모두 통과
- [x] 테스트 커버리지 80% 이상

**의존성**: BE-06, BE-07, BE-20
**예상 소요 시간**: 60분

---

### BE-22 · 카테고리 API 통합 테스트

**상세 작업 내용**

- 파일: `backend/tests/integration/categories.test.js`
- 테스트 케이스:
  - GET /api/categories 기본 카테고리 포함 (200)
  - POST /api/categories 사용자 정의 카테고리 생성 (201)
  - POST /api/categories 중복 카테고리명 (409)
  - DELETE /api/categories/:id 성공 (204)
  - DELETE /api/categories/:id 기본 카테고리 (403)
  - DELETE /api/categories/:id 할일 연결됨 (409)

**완료 조건**

- [x] `categories.test.js` 작성 완료
- [x] 6개 테스트 케이스 모두 통과
- [x] 할일 연결 카테고리 삭제 409 응답 검증 (BR-10)

**의존성**: BE-11, BE-12, BE-13, BE-20
**예상 소요 시간**: 70분

---

### BE-23 · 할일 API 통합 테스트

**상세 작업 내용**

- 파일: `backend/tests/integration/todos.test.js`
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

- [x] `todos.test.js` 작성 완료
- [x] 9개 테스트 케이스 모두 통과 (실제 25개 케이스 통과)
- [x] 필터 파라미터 테스트 포함
- [x] 테스트 커버리지 80% 이상 (실제 90% 이상 달성)

**의존성**: BE-14 ~ BE-18, BE-20
**예상 소요 시간**: 80분

---

### BE-24 · 사용자 API 통합 테스트

**상세 작업 내용**

- 파일: `backend/tests/integration/users.test.js`
- 테스트 케이스:
  - GET /api/users/me 성공 (200)
  - GET /api/users/me 미인증 (401)
  - PATCH /api/users/me 이름 수정 (200)
  - PATCH /api/users/me 비밀번호 8자 미만 (400)
  - PATCH /api/users/me 이메일 수정 불가 확인
  - DELETE /api/users/me 탈퇴 (204)
  - DELETE /api/users/me 탈퇴 후 CASCADE DELETE 검증

**완료 조건**

- [x] `users.test.js` 작성 완료
- [x] 7개 테스트 케이스 모두 통과 (실제 14개 케이스 통과)
- [x] 회원 탈퇴 후 CASCADE DELETE 동작 확인

**의존성**: BE-08, BE-09, BE-10, BE-20
**예상 소요 시간**: 60분

---

### BE-25 · 로그인 후 JWT 만료 시나리오 테스트

**상세 작업 내용**

- 만료된 JWT로 API 요청 → 401 Unauthorized 확인
- 유효하지 않은 서명의 JWT → 401 확인

**완료 조건**

- [x] 만료 토큰 401 응답 확인
- [x] 위조 토큰 401 응답 확인

**의존성**: BE-03, BE-07, BE-20
**예상 소요 시간**: 30분

---

### BE-26 · 전체 백엔드 빌드 및 스모크 테스트

> **참고**: 백엔드는 JavaScript(CommonJS)이므로 별도 컴파일 단계 없음. `npm start`로 직접 실행.

**상세 작업 내용**

- `npm test` (전체 테스트 — Jest + Supertest, 20개 스위트, 236개 케이스)
- `npm run test:coverage` (커버리지 80% 이상 확인)
- `npm start` (서버 구동 확인)

**완료 조건**

- [x] `npm test` 전체 통과 (236개 케이스)
- [x] 테스트 커버리지 80% 이상 (97.1% 달성)
- [x] `npm start` 서버 정상 시작 확인
- [x] `http://localhost:3000/api-docs` Swagger UI 확인

**의존성**: BE-01 ~ BE-25 q
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
- 디렉토리 구조: `frontend/src/{pages,components,hooks,stores,api,types,utils,styles}`
- `src/main.tsx` 작성

**완료 조건**

- [x] `npm run dev` 정상 실행
- [x] `tsc --noEmit` 에러 없음
- [x] 필수 패키지 설치 완료
- [x] 디렉토리 구조 완성

**의존성**: 없음
**예상 소요 시간**: 30분

---

### FE-02 · Axios 클라이언트 설정

**상세 작업 내용**

- 파일: `frontend/src/api/client.ts`
- `VITE_API_BASE_URL` 환경 변수 기반 baseURL 설정 (기본값: `http://localhost:3000`)
- 요청 인터셉터: `authStore.getState().accessToken` 읽어서 `Authorization: Bearer {token}` 자동 주입
- 응답 인터셉터: 401 → authStore 초기화 + `/login` 리다이렉트

**완료 조건**

- [x] `client.ts` 작성 완료
- [x] 요청 인터셉터 토큰 자동 주입 확인
- [x] 401 에러 시 `/login` 리다이렉트 확인
- [x] `.env.example` (`VITE_API_BASE_URL`) 작성

**의존성**: FE-01
**예상 소요 시간**: 60분

---

### FE-03 · Zustand authStore 구현

**상세 작업 내용**

- 파일: `frontend/src/stores/authStore.ts`
- 상태: `accessToken: string | null`, `user: User | null`
- 함수: `setAuth(token, user)`, `clearAuth()`, `isAuthenticated()`
- **메모리만 사용 — localStorage/Cookie 완전 금지**
- 페이지 새로고침 시 토큰 소멸 (의도된 동작)

**완료 조건**

- [x] `authStore.ts` 작성 완료
- [x] localStorage/sessionStorage/Cookie 미사용 확인
- [x] `setAuth()`, `clearAuth()`, `isAuthenticated()` 동작 확인
- [x] TypeScript 타입 안전성 확인

**의존성**: FE-01
**예상 소요 시간**: 45분

---

### FE-04 · TanStack Query 설정

**상세 작업 내용**

- 파일: `frontend/src/config/queryClient.ts`
- QueryClient 인스턴스 생성 (retry: 1, staleTime: 5분)
- `frontend/src/main.tsx`에 `QueryClientProvider` 래핑

**완료 조건**

- [x] `queryClient.ts` 생성 완료
- [x] `main.tsx`에 QueryClientProvider 적용

**의존성**: FE-01, FE-02
**예상 소요 시간**: 30분

---

### FE-05 · 공통 UI 컴포넌트

**상세 작업 내용**

- `frontend/src/components/common/Button.tsx` — variant: primary/secondary/danger
- `frontend/src/components/common/Input.tsx` — 라벨, 에러 메시지 포함
- `frontend/src/components/common/Modal.tsx` — isOpen 제어, 배경 클릭 닫기
- `frontend/src/components/common/Spinner.tsx` — CSS 로딩 스피너
- `frontend/src/components/common/ErrorMessage.tsx` — 에러 알림

**완료 조건**

- [x] Button 컴포넌트 3개 variant 구현 및 스타일 확인
- [x] Input 컴포넌트 에러 메시지 표시 확인
- [x] Modal 컴포넌트 isOpen 제어 확인
- [x] Spinner, ErrorMessage 컴포넌트 렌더링 확인

**의존성**: FE-01
**예상 소요 시간**: 120분

---

### FE-06 · 반응형 CSS 시스템

**상세 작업 내용**

- 파일: `frontend/src/styles/globals.css`
- CSS 변수: 색상, 간격, 폰트, border-radius, shadow
- Breakpoint: Mobile(≤768px), Tablet(769~1024px), Desktop(≥1025px)
- Reset CSS, 기본 폰트 설정

**완료 조건**

- [x] CSS 변수 정의 완료
- [x] 3개 Breakpoint 미디어 쿼리 정의
- [x] 모든 화면에서 레이아웃 깨짐 없음

**의존성**: FE-01
**예상 소요 시간**: 90분

---

### FE-07 · 인증 API 및 Hook

**상세 작업 내용**

- `frontend/src/api/authApi.ts`: `register()`, `login()`
- `frontend/src/hooks/auth/useRegister.ts`: TanStack Query useMutation
- `frontend/src/hooks/auth/useLogin.ts`: 성공 시 authStore 저장 + `/todos` 리다이렉트
- `frontend/src/types/auth.types.ts`: `RegisterInput`, `LoginInput`, `AuthResponse`

**완료 조건**

- [x] `authApi.ts` register/login 함수 구현
- [x] `useRegister`, `useLogin` 훅 구현
- [x] 로그인 성공 시 authStore 저장 및 `/todos` 이동 확인
- [x] 409 (중복 이메일), 401 (잘못된 자격증명) 에러 처리 확인

**의존성**: FE-02, FE-03, FE-04
**예상 소요 시간**: 60분

---

### FE-08 · SCR-01 회원가입 화면

**상세 작업 내용**

- 파일: `frontend/src/pages/auth/RegisterPage.tsx`
- Input 3개: 이메일, 비밀번호, 이름
- 로컬 유효성: 이메일 정규식, 비밀번호 최소 8자
- useRegister 훅 연동
- "이미 계정이 있으신가요? 로그인" 링크

**완료 조건**

- [x] 3개 Input 필드 렌더링
- [x] 로컬 유효성 검사 동작 확인
- [x] useRegister 성공/실패 처리 확인
- [x] 로딩 중 버튼 disabled
- [x] Mobile/Tablet/Desktop 반응형 확인

**의존성**: FE-05, FE-07
**예상 소요 시간**: 90분

---

### FE-09 · SCR-02 로그인 화면

**상세 작업 내용**

- 파일: `frontend/src/pages/auth/LoginPage.tsx`
- Input 2개: 이메일, 비밀번호
- useLogin 훅 연동
- 401 에러 메시지: "이메일 또는 비밀번호가 올바르지 않습니다"
- "계정이 없으신가요? 가입하기" 링크

**완료 조건**

- [x] 2개 Input 필드 렌더링
- [x] useLogin 성공/실패 처리 확인
- [x] 로딩 중 버튼 disabled
- [x] Mobile/Tablet/Desktop 반응형 확인

**의존성**: FE-05, FE-07
**예상 소요 시간**: 90분

---

### FE-10 · 라우팅 및 인증 가드

**상세 작업 내용**

- `frontend/src/config/router.tsx`: 라우트 정의
- `frontend/src/components/layout/PrivateRoute.tsx`: `isAuthenticated()` 확인, false → `/login` 리다이렉트
- `frontend/src/components/layout/Header.tsx`: 네비게이션, 로그아웃 버튼
- 라우트: `/login`, `/register`, `/todos`, `/categories`, `/profile`
- `main.tsx`에 BrowserRouter 통합

**완료 조건**

- [x] PrivateRoute 인증 가드 동작 확인
- [x] 미인증 상태에서 `/todos` 접근 시 `/login` 리다이렉트
- [x] Header 로그아웃 (authStore.clearAuth() + `/login` 이동) 확인
- [x] 모든 라우트 접근 가능 확인

**의존성**: FE-03, FE-08, FE-09
**예상 소요 시간**: 90분

---

### FE-11 · 할일 API 및 Hook

**상세 작업 내용**

- `frontend/src/api/todoApi.ts`: `getTodos(filters)`, `createTodo()`, `updateTodo()`, `deleteTodo()`, `completeTodo()`
- `frontend/src/hooks/todos/useTodos.ts`: useQuery, key `['todos', filters]`
- `frontend/src/hooks/todos/useCreateTodo.ts`: useMutation + invalidate `['todos']`
- `frontend/src/hooks/todos/useUpdateTodo.ts`
- `frontend/src/hooks/todos/useDeleteTodo.ts`
- `frontend/src/hooks/todos/useCompleteTodo.ts`
- `frontend/src/stores/todoFilterStore.ts`: Zustand 필터 상태

**완료 조건**

- [x] todoApi.ts 5개 함수 구현
- [x] 5개 훅 작성 완료 (useQuery/useMutation 사용 확인)
- [x] 뮤테이션 성공 시 쿼리 무효화 동작 확인
- [x] todoFilterStore 구현 완료

**의존성**: FE-02, FE-04
**예상 소요 시간**: 150분

---

### FE-12 · 카테고리 API 및 Hook

**상세 작업 내용**

- `frontend/src/api/categoryApi.ts`: `getCategories()`, `createCategory()`, `deleteCategory()`
- `frontend/src/hooks/categories/useCategories.ts`
- `frontend/src/hooks/categories/useCreateCategory.ts`
- `frontend/src/hooks/categories/useDeleteCategory.ts`: 409, 403 에러 처리

**완료 조건**

- [x] categoryApi.ts 3개 함수 구현
- [x] 3개 훅 작성 완료
- [x] 409 Conflict (할일 연결됨), 403 Forbidden (기본 카테고리) 에러 처리 확인

**의존성**: FE-02, FE-04
**예상 소요 시간**: 60분

---

### FE-13 · 사용자 API 및 Hook

**상세 작업 내용**

- `frontend/src/api/userApi.ts`: `getMe()`, `updateMe()`, `deleteMe()`
- `frontend/src/hooks/users/useMe.ts`: useQuery, key `['me']`
- `frontend/src/hooks/users/useUpdateMe.ts`
- `frontend/src/hooks/users/useDeleteMe.ts`: 성공 시 authStore 초기화 + `/login` 이동

**완료 조건**

- [x] userApi.ts 3개 함수 구현
- [x] 3개 훅 작성 완료
- [x] 회원 탈퇴 후 authStore 초기화 및 `/login` 리다이렉트 확인

**의존성**: FE-02, FE-03, FE-04
**예상 소요 시간**: 90분

---

### FE-14 · 할일 컴포넌트 (Card, Form, List)

**상세 작업 내용**

- `frontend/src/components/todos/TodoCard.tsx`
  - 완료 체크박스, 제목(완료 시 strikethrough), 설명, 마감일, 카테고리 배지, 수정/삭제 버튼
- `frontend/src/components/todos/TodoList.tsx`
  - TodoCard 반복 렌더링, 할일 없음 메시지, 반응형 그리드
- `frontend/src/components/todos/TodoForm.tsx`
  - Modal 래핑, 제목(필수)/설명/마감일/카테고리(필수) 입력
  - 등록/수정 모드 전환 (initialData prop)
- `frontend/src/components/todos/TodoFilter.tsx`
  - 카테고리 드롭다운, 날짜 범위, 완료 여부 라디오, 적용/초기화 버튼

**완료 조건**

- [x] TodoCard 4개 필드(제목, 마감일, 카테고리, 완료) 렌더링 확인
- [x] TodoList 반응형 그리드 (Desktop 2열, Mobile 1열) 확인
- [x] TodoForm 등록/수정 모드 전환 확인
- [x] TodoFilter 4개 필터 요소 동작 확인

**의존성**: FE-05, FE-11, FE-12
**예상 소요 시간**: 180분

---

### FE-15 · SCR-03 할일 목록 화면

**상세 작업 내용**

- 파일: `frontend/src/pages/todos/TodoListPage.tsx`
- TodoFilter + TodoList + "새 할일 추가" 버튼 + TodoForm 모달
- useTodos 필터 연동, useCreateTodo/useUpdateTodo/useDeleteTodo 연동
- 로딩 시 Spinner, 에러 시 ErrorMessage

**완료 조건**

- [x] `TodoListPage.tsx` 작성 완료
- [x] 필터 UI 표시 및 동작 확인
- [x] 할일 등록/수정/삭제 기능 동작 확인
- [x] 로딩/에러 상태 처리 확인
- [x] Mobile/Tablet/Desktop 반응형 확인

**의존성**: FE-11, FE-14
**예상 소요 시간**: 150분

---

### FE-16 · SCR-04 할일 완료 토글 (TodoCard 통합)

**상세 작업 내용**

- TodoCard 체크박스 클릭 시 `useCompleteTodo` 호출
- 성공 시 목록 자동 갱신 (TanStack Query 무효화)

**완료 조건**

- [x] 체크박스 클릭 → useCompleteTodo 호출 확인
- [x] 완료 상태 시각적 표현(strikethrough, opacity) 즉시 반영 확인

**의존성**: FE-15
**예상 소요 시간**: 30분

---

### FE-17 · SCR-05 카테고리 관리 화면

**상세 작업 내용**

- 파일: `frontend/src/pages/categories/CategoryPage.tsx`
- 카테고리 추가 폼, 카테고리 목록 (기본 배지 표시, 사용자 정의 삭제 버튼)
- 409 (할일 연결됨): "해당 카테고리에 연결된 할일이 있어 삭제할 수 없습니다"
- 403 (기본 카테고리): "기본 카테고리는 삭제할 수 없습니다"

**완료 조건**

- [x] `CategoryPage.tsx` 작성 완료
- [x] 기본/사용자 정의 카테고리 구분 표시
- [x] 카테고리 추가/삭제 기능 동작 확인
- [x] 에러 처리(409, 403) 메시지 표시 확인

**의존성**: FE-05, FE-12
**예상 소요 시간**: 120분

---

### FE-18 · SCR-06 내 정보 수정 화면

**상세 작업 내용**

- 파일: `frontend/src/pages/users/ProfilePage.tsx`
- 이메일(읽기 전용), 이름 수정, 비밀번호 변경
- 비밀번호 최소 8자 로컬 검증
- "회원 탈퇴" 버튼 → 확인 대화상자 → useDeleteMe 호출

**완료 조건**

- [x] `ProfilePage.tsx` 작성 완료
- [x] 이메일 읽기 전용 확인
- [x] 비밀번호 최소 8자 검증 확인
- [x] 회원 탈퇴 확인 대화상자 동작 확인
- [x] 탈퇴 후 authStore 초기화 및 `/login` 이동 확인

**의존성**: FE-05, FE-13
**예상 소요 시간**: 120분

---

### FE-19 · 환경 변수 설정

**상세 작업 내용**

- `frontend/.env.example`: `VITE_API_BASE_URL=http://localhost:3000`
- `frontend/.env` (개발), `frontend/.env.production` (운영) 작성
- `src/api/client.ts`에서 `import.meta.env.VITE_API_BASE_URL` 사용

**완료 조건**

- [x] .env.example 작성 및 키 명시
- [x] import.meta.env 사용 확인
- [x] .env를 .gitignore에 추가 확인

**의존성**: FE-01, FE-02
**예상 소요 시간**: 30분

---

### FE-20 · Vitest + React Testing Library 설정

**상세 작업 내용**

- `vite.config.ts` 수정: test environment jsdom, globals true, setupFiles
- `frontend/tests/setup.ts` 작성
- package.json: `test`, `test:ui`, `test:coverage` 스크립트
- 의존성: `@vitest/ui`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`

**완료 조건**

- [x] Vitest 설정 완료
- [x] `npm run test` 실행 가능 확인

**의존성**: FE-01
**예상 소요 시간**: 60분

---

### FE-21 · Button/Input 컴포넌트 테스트

**상세 작업 내용**

- `frontend/tests/components/Button.test.tsx`
  - 렌더링, onClick, disabled, variant, children 테스트
- `frontend/tests/components/Input.test.tsx`
  - 렌더링, onChange, value, error 메시지, required 테스트

**완료 조건**

- [ ] Button 5개 테스트 케이스 통과
- [ ] Input 5개 테스트 케이스 통과

**의존성**: FE-05, FE-20
**예상 소요 시간**: 90분

---

### FE-22 · TodoCard 컴포넌트 테스트

**상세 작업 내용**

- 파일: `frontend/tests/components/TodoCard.test.tsx`
- 샘플 Todo 객체 사용
- 렌더링, isCompleted strikethrough, onEdit/onDelete 콜백, 설명 없음 처리 테스트

**완료 조건**

- [ ] 5개 테스트 케이스 통과

**의존성**: FE-14, FE-20
**예상 소요 시간**: 60분

---

### FE-23 · useTodos Hook 테스트

**상세 작업 내용**

- 파일: `frontend/tests/hooks/useTodos.test.ts`
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

- 파일: `frontend/tests/pages/LoginPage.test.tsx`
- 렌더링, 폼 제출, 유효성 에러, 로그인 성공 리다이렉트, 401 에러 메시지 테스트

**완료 조건**

- [ ] 5개 테스트 케이스 통과

**의존성**: FE-09, FE-20
**예상 소요 시간**: 90분

---

### FE-25 · 주요 시나리오 통합 테스트

**상세 작업 내용**

- `frontend/tests/integration/auth.test.ts`: SCN-01(회원가입), SCN-02(로그인), SCN-16(JWT 만료)
- `frontend/tests/integration/todos.test.ts`: SCN-04~08 (CRUD + 필터)
- `frontend/tests/integration/categories.test.ts`: SCN-09~10, SCN-22 (409 에러)

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

### BE-27 · 사용자 테마 설정 컬럼 추가 (DB 마이그레이션)

**상세 작업 내용**

- 로컬 PostgreSQL에서 `users` 테이블에 `theme` 컬럼 추가:
  ```sql
  ALTER TABLE users ADD COLUMN theme VARCHAR(10) NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark'));
  ```
- `todolist_dev` 및 `todolist_test` DB 모두 적용

**완료 조건**

- [x] `users` 테이블에 `theme` 컬럼 추가 확인
- [x] 기본값 'light' 적용 확인
- [x] CHECK 제약 조건 작동 확인

**의존성**: DB-01, DB-02
**예상 소요 시간**: 20분

---

### BE-28 · 사용자 정보 수정 API 확장 (테마 지원)

**상세 작업 내용**

- `userRepository.update`: `theme` 필드 업데이트 로직 추가
- `userController`, `userService`: `PATCH /api/users/me` 요청 시 `theme` 필드 처리
- `authController`: 로그인 시 응답 객체에 `theme` 포함
- 통합 테스트(`users.test.js`)에 테마 수정 케이스 추가

**완료 조건**

- [x] `PATCH /api/users/me`로 테마 수정 성공 확인
- [x] 로그인 응답 및 `GET /api/users/me` 응답에 `theme` 포함 확인
- [x] 잘못된 테마 값 전송 시 에러 처리 확인

**의존성**: BE-09, BE-27
**예상 소요 시간**: 60분

---

### FE-27 · 다크 모드(Dark Mode) 구현 및 서버 동기화 (UC-12)

**상세 작업 내용**

- `frontend/src/stores/themeStore.ts`: 테마 상태(light/dark) 및 전환 함수 구현 (Zustand)
- 테마 전환 시 백엔드 `PATCH /api/users/me` API 호출하여 동기화
- 로그인 성공 시 서버에서 받은 `theme` 값을 `themeStore`에 반영
- `frontend/src/styles/globals.css`: `data-theme="dark"` 선택자를 사용하여 다크 모드 변수 정의
- `frontend/src/components/layout/Header.tsx`: 테마 전환 토글 버튼 추가

**완료 조건**

- [ ] 테마 전환 토글 버튼 작동 확인
- [ ] 테마 전환 시 서버 DB에 반영되는지 확인
- [ ] 다른 기기/브라우저 로그인 시 설정된 테마가 자동 적용되는지 확인
- [ ] 모든 컴포넌트에 다크 모드 스타일이 정상 적용됨 확인

**의존성**: FE-01, FE-06, BE-28
**예상 소요 시간**: 180분

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

| 비즈니스 규칙                            | 구현 Task                                        |
| ---------------------------------------- | ------------------------------------------------ |
| BR-03 (본인 할일만 접근)                 | BE-14, BE-16, BE-17, BE-18 (Service 소유권 검증) |
| BR-04 (할일 등록 시 카테고리 필수)       | BE-15 (Controller/DB NOT NULL)                   |
| BR-05 (description, dueDate 선택)        | DB-02 (NULL 허용 컬럼), BE-15                    |
| BR-06 (완료 상태 취소 가능)              | BE-18 (토글 로직)                                |
| BR-07 (기본 카테고리 user_id=NULL)       | DB-03 (Seed 데이터)                              |
| BR-09 (사용자 정의 카테고리 본인만 접근) | BE-11, BE-12, FE-12                              |
| BR-10 (할일 연결 카테고리 삭제 차단)     | DB-02 (RESTRICT FK), BE-13, FE-17                |
| BR-12 (이메일 변경 불가)                 | BE-09 (Controller), FE-18 (읽기 전용)            |
| UC-11 (회원 탈퇴 CASCADE DELETE)         | DB-02 (CASCADE FK), BE-10                        |
