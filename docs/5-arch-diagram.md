# TodoListApp 기술 아키텍처 다이어그램

- 버전: 1.0.0
- 작성일: 2026-05-13
- 참조 문서:
  - `1-domain-definition.md` — 도메인 모델 및 엔티티 관계
  - `2-prd.md` — 기능/비기능 요구사항 및 API 목록
  - `4-project-principles.md` — 레이어 구조 및 의존성 원칙

---

## 변경 이력

| 버전  | 변경일     | 변경 내용 | 변경자   |
|-------|------------|-----------|----------|
| 1.0.0 | 2026-05-13 | 최초 작성 | aliceKim |
| 1.0.1 | 2026-05-13 | 4. 인증 흐름 다이어그램 추가 | aliceKim |
| 1.0.2 | 2026-05-13 | 시스템 아키텍처에 HTTPS 명시, 인증 흐름에 비밀번호 8자 검증·JWT 만료 시간(1h) 추가 | aliceKim |
| 1.0.3 | 2026-05-13 | 인증 흐름에 Zustand 메모리 저장 명시 (localStorage·Cookie 미사용) | aliceKim |

---

## 1. 전체 시스템 아키텍처

```mermaid
graph LR
    Client["웹/모바일 브라우저<br/>(반응형)"]

    subgraph Frontend["Frontend (React 19 + TypeScript)"]
        Page["Page"]
        Component["Component"]
        Hook["Hook<br/>(TanStack Query)"]
        Store["Zustand Store"]
        APIClient["API Client<br/>(Axios)"]
    end

    subgraph Backend["Backend (Node.js + Express)"]
        Route["Route"]
        Controller["Controller"]
        Service["Service"]
        Repository["Repository"]
    end

    DB[("PostgreSQL 17")]

    Client -->|HTTP 요청| Page
    Page --> Component
    Page --> Hook
    Component --> Hook
    Hook --> APIClient
    Store -.->|전역 상태| Hook
    Store -.->|전역 상태| Component

    APIClient -->|REST API (HTTPS)<br/>JSON| Route
    APIClient -.->|JWT Access Token<br/>Authorization 헤더| Route

    Route --> Controller
    Controller --> Service
    Service --> Repository
    Repository -->|SQL (pg)| DB
```

---

## 2. 백엔드 레이어 구조

```mermaid
graph TD
    MW["Middleware<br/>(JWT 인증 · 로깅)"]
    R["Route<br/>URL 매핑 · 라우팅"]
    C["Controller<br/>요청/응답 처리 · 입력값 검증"]
    S["Service<br/>비즈니스 로직 · 도메인 규칙"]
    Repo["Repository<br/>SQL 실행 · 결과 매핑"]
    DB[("PostgreSQL 17")]

    MW -.->|체인 삽입| R
    R -->|호출| C
    C -->|호출| S
    S -->|호출| Repo
    Repo -->|pg Pool| DB
```

---

## 3. 데이터베이스 ERD

```mermaid
erDiagram
    User {
        UUID id PK
        string email
        string password
        string name
        datetime createdAt
    }

    Category {
        UUID id PK
        UUID userId FK
        string name
        boolean isDefault
    }

    Todo {
        UUID id PK
        UUID userId FK
        UUID categoryId FK
        string title
        date dueDate
        boolean isCompleted
        datetime createdAt
    }

    User ||--o{ Todo : "소유"
    User ||--o{ Category : "생성"
    Category ||--o{ Todo : "분류"
```

---

## 4. 인증 흐름

```mermaid
sequenceDiagram
    actor U as 사용자
    participant FE as Frontend
    participant MW as Middleware (JWT)
    participant API as Backend API
    participant DB as PostgreSQL

    rect rgb(230, 245, 230)
        Note over U, DB: 회원가입 (UC-01)
        U->>FE: 이메일·비밀번호·이름 입력
        FE->>API: POST /api/auth/register
        API->>API: 비밀번호 최소 8자 검증
        API->>DB: 이메일 중복 확인
        DB-->>API: 결과 반환
        API->>DB: 비밀번호 bcrypt 해시 저장
        API-->>FE: 201 Created
        FE-->>U: 가입 완료 안내
    end

    rect rgb(230, 240, 255)
        Note over U, DB: 로그인 (UC-02)
        U->>FE: 이메일·비밀번호 입력
        FE->>API: POST /api/auth/login
        API->>DB: 사용자 조회
        DB-->>API: User 반환
        API->>API: bcrypt 비밀번호 검증
        API-->>FE: 200 OK + JWT Access Token (만료: 1h)
        FE->>FE: Zustand authStore 메모리에 토큰 저장<br/>(localStorage·Cookie 미사용)
        FE-->>U: 할일 목록 화면으로 이동
    end

    rect rgb(255, 245, 230)
        Note over U, DB: 인증이 필요한 API 요청 (UC-04 ~ UC-11)
        U->>FE: 할일 등록 / 조회 등 요청
        FE->>MW: API 요청 + Authorization: Bearer {JWT}
        MW->>MW: JWT 서명 및 만료 검증
        alt 유효한 토큰
            MW->>API: req.user 주입 후 다음 레이어 전달
            API->>DB: 비즈니스 로직 처리
            DB-->>API: 결과 반환
            API-->>FE: 200 OK + 응답 데이터
            FE-->>U: 화면 업데이트
        else 만료 또는 유효하지 않은 토큰
            MW-->>FE: 401 Unauthorized
            FE-->>U: 로그인 화면으로 리다이렉트
        end
    end
```
