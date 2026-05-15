'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-integration';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express = require('express');
const request = require('supertest');
const pool = require('../../src/db/pool');
const authRoutes = require('../../src/routes/authRoutes');
const errorHandler = require('../../src/middlewares/errorHandler');
const { truncateUsers } = require('../helpers/truncate');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

const BASE = '/api/auth/register';

describe('BE-06 · 회원가입 API (POST /api/auth/register)', () => {
  let app;

  beforeAll(() => {
    app = makeApp();
  });

  beforeEach(async () => {
    await truncateUsers(pool);
  });

  afterAll(async () => {
    await truncateUsers(pool);
    await pool.end();
  });

  describe('201 Created - 정상 가입', () => {
    it('유효한 입력 → 201, accessToken + user 반환', async () => {
      const res = await request(app).post(BASE).send({
        email: 'test@example.com',
        password: 'password123',
        name: '홍길동',
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.user).toMatchObject({
        email: 'test@example.com',
        name: '홍길동',
      });
    });

    it('응답 본문에 password 미포함', async () => {
      const res = await request(app).post(BASE).send({
        email: 'user2@example.com',
        password: 'securePass!',
        name: '김철수',
      });
      expect(res.status).toBe(201);
      expect(res.body.user.password).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('securePass!');
    });

    it('응답 user에 id, email, name, createdAt, updatedAt 포함', async () => {
      const res = await request(app).post(BASE).send({
        email: 'user3@example.com',
        password: 'mypassword',
        name: '이영희',
      });
      expect(res.status).toBe(201);
      const { user } = res.body;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email', 'user3@example.com');
      expect(user).toHaveProperty('name', '이영희');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });
  });

  describe('400 Bad Request - 입력값 검증', () => {
    it('이메일 형식 오류 → 400', async () => {
      const res = await request(app).post(BASE).send({
        email: 'not-an-email',
        password: 'password123',
        name: '홍길동',
      });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe(400);
    });

    it('비밀번호 7자 → 400 (최소 8자)', async () => {
      const res = await request(app).post(BASE).send({
        email: 'valid@example.com',
        password: '1234567',
        name: '홍길동',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('8자');
    });

    it('이름 누락 → 400', async () => {
      const res = await request(app).post(BASE).send({
        email: 'valid@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(400);
    });

    it('이름 빈 문자열 → 400', async () => {
      const res = await request(app).post(BASE).send({
        email: 'valid@example.com',
        password: 'password123',
        name: '',
      });
      expect(res.status).toBe(400);
    });

    it('이메일 누락 → 400', async () => {
      const res = await request(app).post(BASE).send({
        password: 'password123',
        name: '홍길동',
      });
      expect(res.status).toBe(400);
    });

    it('비밀번호 누락 → 400', async () => {
      const res = await request(app).post(BASE).send({
        email: 'valid@example.com',
        name: '홍길동',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('409 Conflict - 이메일 중복', () => {
    it('동일 이메일 재가입 → 409', async () => {
      await request(app).post(BASE).send({
        email: 'dup@example.com',
        password: 'password123',
        name: '홍길동',
      });

      const res = await request(app).post(BASE).send({
        email: 'dup@example.com',
        password: 'anotherPass456',
        name: '다른이름',
      });
      expect(res.status).toBe(409);
      expect(res.body.status).toBe(409);
    });
  });
});
