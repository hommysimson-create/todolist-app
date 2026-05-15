-- =============================================================
-- TodoListApp Database Schema
-- 버전   : 1.0.0
-- 작성일  : 2026-05-13
-- 참조    : docs/6-erd.md
-- DB     : PostgreSQL 17
-- =============================================================

-- UUID 생성 함수 활성화
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- TABLE: users
-- 설명  : 사용자 계정 정보. 이메일은 변경 불가(BR-12).
-- =============================================================
CREATE TABLE users (
    id          UUID          NOT NULL DEFAULT gen_random_uuid(),
    email       VARCHAR(255)  NOT NULL,
    password    VARCHAR(255)  NOT NULL,
    name        VARCHAR(100)  NOT NULL,
    theme       VARCHAR(10)   NOT NULL DEFAULT 'light',
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT NOW(),

    CONSTRAINT users_pkey        PRIMARY KEY (id),
    CONSTRAINT users_email_key   UNIQUE      (email),
    CONSTRAINT users_theme_check CHECK       (theme IN ('light', 'dark'))
);

-- =============================================================
-- TABLE: categories
-- 설명  : 할일 분류 카테고리.
--        is_default=true  → user_id=NULL  (시스템 기본 카테고리, BR-07)
--        is_default=false → user_id=해당사용자 (사용자 정의 카테고리, BR-09)
-- =============================================================
CREATE TABLE categories (
    id          UUID          NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID,
    name        VARCHAR(100)  NOT NULL,
    is_default  BOOLEAN       NOT NULL DEFAULT false,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),

    CONSTRAINT categories_pkey
        PRIMARY KEY (id),

    CONSTRAINT categories_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    -- 동일 사용자 내 카테고리명 중복 방지 (UC-09)
    CONSTRAINT categories_user_id_name_key
        UNIQUE (user_id, name),

    -- 기본 카테고리(is_default=true)는 user_id가 반드시 NULL (BR-07)
    CONSTRAINT categories_default_user_check
        CHECK (NOT is_default OR user_id IS NULL)
);

-- =============================================================
-- TABLE: todos
-- 설명  : 할일 정보.
--        category_id NOT NULL → 할일 등록 시 카테고리 필수 (BR-04)
--        categories FK ON DELETE RESTRICT → 할일 연결된 카테고리 삭제 차단 (BR-10)
--        users FK ON DELETE CASCADE → 회원 탈퇴 시 할일 전체 삭제 (UC-11)
-- =============================================================
CREATE TABLE todos (
    id           UUID          NOT NULL DEFAULT gen_random_uuid(),
    user_id      UUID          NOT NULL,
    category_id  UUID          NOT NULL,
    title        VARCHAR(255)  NOT NULL,
    description  TEXT,
    due_date     DATE,
    is_completed BOOLEAN       NOT NULL DEFAULT false,
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP     NOT NULL DEFAULT NOW(),

    CONSTRAINT todos_pkey
        PRIMARY KEY (id),

    -- 사용자 탈퇴 시 할일 전체 삭제 (UC-11)
    CONSTRAINT todos_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    -- 할일이 연결된 카테고리 삭제 차단 (BR-10)
    CONSTRAINT todos_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT
);

-- =============================================================
-- INDEXES
-- =============================================================

-- categories
CREATE INDEX categories_user_id_idx
    ON categories (user_id);

-- todos: 사용자별 할일 목록 조회 (UC-08)
CREATE INDEX todos_user_id_idx
    ON todos (user_id);

-- todos: 카테고리별 필터링 조회 (UC-08)
CREATE INDEX todos_category_id_idx
    ON todos (category_id);

-- todos: 사용자별 등록일 내림차순 기본 정렬
CREATE INDEX todos_user_id_created_at_idx
    ON todos (user_id, created_at DESC);

-- todos: 종료 기간 필터링 조회 (UC-08)
CREATE INDEX todos_user_id_due_date_idx
    ON todos (user_id, due_date);

-- =============================================================
-- SEED: 기본 카테고리 (BR-07)
-- user_id=NULL, is_default=true 로 모든 사용자에게 공유
-- =============================================================
INSERT INTO categories (id, user_id, name, is_default) VALUES
    (gen_random_uuid(), NULL, '업무',     true),
    (gen_random_uuid(), NULL, '개인',     true),
    (gen_random_uuid(), NULL, '쇼핑',     true),
    (gen_random_uuid(), NULL, '건강',     true),
    (gen_random_uuid(), NULL, '학습',     true);
