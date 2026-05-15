'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-integration';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const request = require('supertest');
const pool = require('../../src/db/pool');
const app = require('../../app');

describe('BE-19 · Express 앱 초기화 스모크 테스트', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('라우터 등록 확인', () => {
    it('POST /api/auth/register → 400 or 409 (라우트 존재 확인)', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect([400, 409]).toContain(res.status);
    });

    it('GET /api/users/me → 401 (인증 필요, 라우트 존재 확인)', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });

    it('GET /api/todos → 401 (인증 필요, 라우트 존재 확인)', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(401);
    });

    it('GET /api/categories → 401 (인증 필요, 라우트 존재 확인)', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(401);
    });
  });

  describe('404 핸들러 확인', () => {
    it('존재하지 않는 경로 → 404', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe(404);
    });

    it('존재하지 않는 경로 응답 body에 status, message 포함', async () => {
      const res = await request(app).get('/this-does-not-exist');
      expect(res.body).toHaveProperty('status', 404);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('CORS 헤더 확인', () => {
    it('응답에 Access-Control-Allow-Origin 헤더 포함', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });

    it('OPTIONS 요청 → 204', async () => {
      const res = await request(app)
        .options('/api/todos')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');
      expect(res.status).toBe(204);
    });
  });

  describe('에러 핸들러 확인', () => {
    it('잘못된 JSON body → 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      expect(res.status).toBe(400);
    });
  });
});
