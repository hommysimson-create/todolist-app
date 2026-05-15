'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-integration';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
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

const REGISTER = '/api/auth/register';
const LOGIN = '/api/auth/login';

const TEST_USER = {
  email: 'login-test@example.com',
  password: 'password123',
  name: '테스트유저',
};

describe('BE-07 · 로그인 API (POST /api/auth/login)', () => {
  let app;

  beforeAll(async () => {
    app = makeApp();
    await truncateUsers(pool);
    await request(app).post(REGISTER).send(TEST_USER);
  });

  afterAll(async () => {
    await truncateUsers(pool);
    await pool.end();
  });

  describe('200 OK - 정상 로그인', () => {
    it('올바른 자격증명 → 200, accessToken + user 반환', async () => {
      const res = await request(app).post(LOGIN).send({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.user).toMatchObject({
        email: TEST_USER.email,
        name: TEST_USER.name,
      });
    });

    it('응답 본문에 password 미포함', async () => {
      const res = await request(app).post(LOGIN).send({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });
      expect(res.status).toBe(200);
      expect(res.body.user.password).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain(TEST_USER.password);
    });

    it('응답 user에 id, email, name, createdAt, updatedAt 포함', async () => {
      const res = await request(app).post(LOGIN).send({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });
      const { user } = res.body;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email', TEST_USER.email);
      expect(user).toHaveProperty('name', TEST_USER.name);
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });

    it('발급된 JWT 만료 시간 1h 확인', async () => {
      const res = await request(app).post(LOGIN).send({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });
      const decoded = jwt.decode(res.body.accessToken);
      expect(decoded.exp - decoded.iat).toBe(3600);
    });

    it('발급된 JWT payload에 userId, email 포함', async () => {
      const res = await request(app).post(LOGIN).send({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });
      const decoded = jwt.decode(res.body.accessToken);
      expect(decoded).toHaveProperty('userId');
      expect(decoded.email).toBe(TEST_USER.email);
    });
  });

  describe('401 Unauthorized - 잘못된 자격증명', () => {
    it('존재하지 않는 이메일 → 401', async () => {
      const res = await request(app).post(LOGIN).send({
        email: 'notexist@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(401);
      expect(res.body.status).toBe(401);
    });

    it('비밀번호 불일치 → 401', async () => {
      const res = await request(app).post(LOGIN).send({
        email: TEST_USER.email,
        password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
      expect(res.body.status).toBe(401);
    });

    it('에러 메시지에 실제 비밀번호 미포함', async () => {
      const res = await request(app).post(LOGIN).send({
        email: TEST_USER.email,
        password: 'wrongpassword',
      });
      expect(res.body.message).not.toContain('wrongpassword');
    });
  });

  describe('400 Bad Request - 입력값 검증', () => {
    it('이메일 형식 오류 → 400', async () => {
      const res = await request(app).post(LOGIN).send({
        email: 'bademail',
        password: 'password123',
      });
      expect(res.status).toBe(400);
    });

    it('비밀번호 7자 → 400', async () => {
      const res = await request(app).post(LOGIN).send({
        email: TEST_USER.email,
        password: '1234567',
      });
      expect(res.status).toBe(400);
    });

    it('이메일 누락 → 400', async () => {
      const res = await request(app).post(LOGIN).send({ password: 'password123' });
      expect(res.status).toBe(400);
    });

    it('비밀번호 누락 → 400', async () => {
      const res = await request(app).post(LOGIN).send({ email: TEST_USER.email });
      expect(res.status).toBe(400);
    });
  });
});
