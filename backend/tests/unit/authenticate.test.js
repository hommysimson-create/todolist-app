'use strict';

process.env.JWT_SECRET = 'test-secret-for-unit-test';

const express = require('express');
const request = require('supertest');
const authenticate = require('../../src/middlewares/authenticate');
const { sign } = require('../../src/utils/jwt');
const jwt = require('jsonwebtoken');

function makeApp() {
  const app = express();
  app.get('/protected', authenticate, (req, res) => {
    res.json({ userId: req.user.userId, email: req.user.email });
  });
  return app;
}

describe('BE-03 · authenticate 미들웨어', () => {
  let app;

  beforeAll(() => {
    app = makeApp();
  });

  describe('정상 인증', () => {
    it('유효한 Bearer 토큰 → 200, req.user 주입', async () => {
      const token = sign({ userId: 'user-123', email: 'test@example.com' });
      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.userId).toBe('user-123');
      expect(res.body.email).toBe('test@example.com');
    });
  });

  describe('Authorization 헤더 누락/형식 오류', () => {
    it('Authorization 헤더 없으면 → 401', async () => {
      const res = await request(app).get('/protected');
      expect(res.status).toBe(401);
      expect(res.body.status).toBe(401);
    });

    it('Bearer 접두사 없으면 → 401', async () => {
      const token = sign({ userId: 'u1' });
      const res = await request(app)
        .get('/protected')
        .set('Authorization', token);
      expect(res.status).toBe(401);
    });

    it('빈 토큰(Bearer 만 있음) → 401', async () => {
      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer ');
      expect(res.status).toBe(401);
    });
  });

  describe('유효하지 않은 토큰', () => {
    it('손상된 토큰 → 401', async () => {
      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer bad.token.value');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('유효하지 않은');
    });

    it('다른 secret으로 서명된 토큰 → 401', async () => {
      const fakeToken = jwt.sign({ userId: 'u2', email: 'x@y.com' }, 'wrong-secret', { expiresIn: '1h' });
      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${fakeToken}`);
      expect(res.status).toBe(401);
    });
  });

  describe('만료된 토큰', () => {
    it('만료된 토큰 → 401, "만료" 메시지', async () => {
      const expiredToken = jwt.sign(
        { userId: 'u3', email: 'exp@test.com' },
        'test-secret-for-unit-test',
        { expiresIn: -1 },
      );
      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('만료');
    });
  });

  describe('응답 형식', () => {
    it('401 응답은 { status, message } 형식', async () => {
      const res = await request(app).get('/protected');
      expect(res.body).toHaveProperty('status', 401);
      expect(res.body).toHaveProperty('message');
      expect(typeof res.body.message).toBe('string');
    });
  });
});
