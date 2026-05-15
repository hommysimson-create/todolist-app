'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-integration';

const request = require('supertest');
const app = require('../../app');
const pool = require('../../src/db/pool');
const { truncateUsers } = require('../helpers/truncate');

describe('BE-21 · 인증 API 통합 테스트', () => {
  beforeEach(async () => {
    await truncateUsers(pool);
  });

  afterAll(async () => {
    await truncateUsers(pool);
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    const REGISTER_URL = '/api/auth/register';

    it('성공 (201): 유효한 정보로 회원가입', async () => {
      const res = await request(app)
        .post(REGISTER_URL)
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: '홍길동'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toMatchObject({
        email: 'test@example.com',
        name: '홍길동',
        theme: 'light'
      });
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('중복 이메일 (409): 이미 존재하는 이메일로 가입 시도', async () => {
      // 첫 번째 가입
      await request(app)
        .post(REGISTER_URL)
        .send({
          email: 'dup@example.com',
          password: 'password123',
          name: '홍길동'
        });

      // 동일한 이메일로 두 번째 가입 시도
      const res = await request(app)
        .post(REGISTER_URL)
        .send({
          email: 'dup@example.com',
          password: 'anotherpassword',
          name: '김철수'
        });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('이미 사용 중인 이메일');
    });

    it('비밀번호 8자 미만 (400): 유효하지 않은 비밀번호 정책', async () => {
      const res = await request(app)
        .post(REGISTER_URL)
        .send({
          email: 'short@example.com',
          password: 'short',
          name: '이영희'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('8자');
    });

    it('이메일 형식 오류 (400): 유효하지 않은 이메일 형식', async () => {
      const res = await request(app)
        .post(REGISTER_URL)
        .send({
          email: 'not-an-email',
          password: 'password123',
          name: '홍길동'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('이메일 형식');
    });

    it('이름 유효성 오류 (400): 이름이 비어있거나 너무 김', async () => {
      const res = await request(app)
        .post(REGISTER_URL)
        .send({
          email: 'valid@example.com',
          password: 'password123',
          name: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('이름');
    });
  });

  describe('POST /api/auth/login', () => {
    const LOGIN_URL = '/api/auth/login';
    const REGISTER_URL = '/api/auth/register';

    beforeEach(async () => {
      // 테스트용 유저 미리 생성
      await request(app)
        .post(REGISTER_URL)
        .send({
          email: 'login@example.com',
          password: 'password123',
          name: '로그인유저'
        });
    });

    it('성공 (200): 올바른 자격증명으로 로그인', async () => {
      const res = await request(app)
        .post(LOGIN_URL)
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toMatchObject({
        email: 'login@example.com',
        name: '로그인유저',
        theme: 'light'
      });
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('잘못된 비밀번호 (401): 일치하지 않는 비밀번호', async () => {
      const res = await request(app)
        .post(LOGIN_URL)
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('올바르지 않습니다');
    });

    it('이메일 형식 오류 (400): 유효하지 않은 이메일 형식', async () => {
      const res = await request(app)
        .post(LOGIN_URL)
        .send({
          email: 'bad-email',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('이메일 형식');
    });

    it('비밀번호 8자 미만 (400): 유효하지 않은 비밀번호 정책', async () => {
      const res = await request(app)
        .post(LOGIN_URL)
        .send({
          email: 'login@example.com',
          password: 'short'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('8자');
    });
  });
});
