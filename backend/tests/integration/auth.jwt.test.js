'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-jwt-integration';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const pool = require('../../src/db/pool');

describe('BE-25 · JWT 보안 및 만료 시나리오 테스트', () => {
  const TARGET_URL = '/api/users/me';
  const SECRET = process.env.JWT_SECRET;

  afterAll(async () => {
    await pool.end();
  });

  describe('만료된 토큰 (Expired Token)', () => {
    it('실패 (401): 만료된 토큰 전달 시 "만료" 메시지 포함 응답', async () => {
      // 1초 전에 만료된 토큰 생성
      const expiredToken = jwt.sign(
        { userId: 'test-user-id', email: 'test@example.com' },
        SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get(TARGET_URL)
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.status).toBe(401);
      expect(res.body.message).toContain('만료');
    });
  });

  describe('위조된 토큰 (Forged Token - Invalid Signature)', () => {
    it('실패 (401): 잘못된 시크릿으로 서명된 토큰 전달 시 "유효하지 않은" 메시지 포함 응답', async () => {
      const forgedToken = jwt.sign(
        { userId: 'test-user-id', email: 'test@example.com' },
        'wrong-secret'
      );

      const res = await request(app)
        .get(TARGET_URL)
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.status).toBe(401);
      expect(res.body.message).toContain('유효하지 않은');
    });
  });

  describe('잘못된 형식의 토큰 (Malformed Token)', () => {
    it('실패 (401): JWT 구조가 아닌 문자열 전달 시 401 응답', async () => {
      const malformedToken = 'not.a.jwt.token';

      const res = await request(app)
        .get(TARGET_URL)
        .set('Authorization', `Bearer ${malformedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.status).toBe(401);
      expect(res.body.message).toContain('유효하지 않은');
    });
  });

  describe('잘못된 Prefix (Invalid Prefix)', () => {
    it('실패 (401): "Bearer " 접두사가 없거나 다른 접두사 사용 시 "인증 토큰이 필요합니다" 메시지 포함 응답', async () => {
      const token = jwt.sign(
        { userId: 'test-user-id', email: 'test@example.com' },
        SECRET
      );

      // 접두사 없음
      const resNoPrefix = await request(app)
        .get(TARGET_URL)
        .set('Authorization', token);

      expect(resNoPrefix.status).toBe(401);
      expect(resNoPrefix.body.message).toContain('인증 토큰이 필요합니다');

      // 다른 접두사
      const resWrongPrefix = await request(app)
        .get(TARGET_URL)
        .set('Authorization', `Token ${token}`);

      expect(resWrongPrefix.status).toBe(401);
      expect(resWrongPrefix.body.message).toContain('인증 토큰이 필요합니다');
    });
  });

  describe('헤더 누락 (Missing Header)', () => {
    it('실패 (401): Authorization 헤더 누락 시 401 응답', async () => {
      const res = await request(app)
        .get(TARGET_URL);

      expect(res.status).toBe(401);
      expect(res.body.status).toBe(401);
      expect(res.body.message).toContain('인증 토큰이 필요합니다');
    });
  });
});
