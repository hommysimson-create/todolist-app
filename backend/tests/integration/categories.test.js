'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-integration';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express = require('express');
const request = require('supertest');
const pool = require('../../src/db/pool');
const authRoutes = require('../../src/routes/authRoutes');
const categoryRoutes = require('../../src/routes/categoryRoutes');
const errorHandler = require('../../src/middlewares/errorHandler');
const { truncateUsers } = require('../helpers/truncate');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use(errorHandler);
  return app;
}

const REGISTER = '/api/auth/register';
const CATEGORIES = '/api/categories';

describe('BE-22 · Category API Integration Tests', () => {
  let app;
  let tokenA;
  let tokenB;
  let userAId;

  beforeAll(async () => {
    app = makeApp();
    await truncateUsers(pool);

    const resA = await request(app).post(REGISTER).send({
      email: 'category-test-a@example.com',
      password: 'password123',
      name: '사용자A',
    });
    tokenA = resA.body.accessToken;
    userAId = resA.body.user.id;

    const resB = await request(app).post(REGISTER).send({
      email: 'category-test-b@example.com',
      password: 'password123',
      name: '사용자B',
    });
    tokenB = resB.body.accessToken;
  });

  afterAll(async () => {
    await truncateUsers(pool);
    await pool.end();
  });

  const authA = () => ({ Authorization: `Bearer ${tokenA}` });
  const authB = () => ({ Authorization: `Bearer ${tokenB}` });

  describe('GET /api/categories', () => {
    it('200: 기본 카테고리 포함 반환', async () => {
      const res = await request(app)
        .get(CATEGORIES)
        .set(authA());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const defaults = res.body.filter(c => c.isDefault === true);
      expect(defaults.length).toBeGreaterThan(0);
    });

    it('200: 사용자 정의 카테고리 포함 반환', async () => {
      // 카테고리 하나 생성
      await request(app).post(CATEGORIES).set(authA()).send({ name: '사이드프로젝트' });
      
      const res = await request(app)
        .get(CATEGORIES)
        .set(authA());
      const custom = res.body.filter(c => c.isDefault === false);
      expect(custom.length).toBeGreaterThan(0);
      expect(custom.some(c => c.name === '사이드프로젝트')).toBe(true);
    });

    it('200: 타인 카테고리 미포함 (BR-09)', async () => {
      const res = await request(app)
        .get(CATEGORIES)
        .set(authB());
      expect(res.status).toBe(200);
      const hasUserACustom = res.body.some(c => c.name === '사이드프로젝트');
      expect(hasUserACustom).toBe(false);
    });
  });

  describe('POST /api/categories', () => {
    it('201: 사용자 정의 카테고리 생성', async () => {
      const res = await request(app)
        .post(CATEGORIES)
        .set(authA())
        .send({ name: '새카테고리' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('새카테고리');
      expect(res.body.isDefault).toBe(false);
      expect(res.body.userId).toBe(userAId);
    });

    it('409: 동일 사용자 내 중복 카테고리명', async () => {
      await request(app).post(CATEGORIES).set(authA()).send({ name: '중복테스트' });
      const res = await request(app)
        .post(CATEGORIES)
        .set(authA())
        .send({ name: '중복테스트' });
      expect(res.status).toBe(409);
      expect(res.body.message).toBe('이미 존재하는 카테고리 이름입니다.');
    });

    it('400: 유효하지 않은 이름 (빈 문자열)', async () => {
      const res = await request(app)
        .post(CATEGORIES)
        .set(authA())
        .send({ name: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('204: 사용자 정의 카테고리 삭제 성공', async () => {
      const catRes = await request(app).post(CATEGORIES).set(authA()).send({ name: '삭제용' });
      const catId = catRes.body.id;

      const res = await request(app)
        .delete(`${CATEGORIES}/${catId}`)
        .set(authA());
      expect(res.status).toBe(204);

      // 삭제 확인
      const listRes = await request(app).get(CATEGORIES).set(authA());
      expect(listRes.body.find(c => c.id === catId)).toBeUndefined();
    });

    it('403: 기본 카테고리 삭제 시도', async () => {
      const listRes = await request(app).get(CATEGORIES).set(authA());
      const defaultCat = listRes.body.find(c => c.isDefault === true);
      
      const res = await request(app)
        .delete(`${CATEGORIES}/${defaultCat.id}`)
        .set(authA());
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('기본 카테고리는 삭제할 수 없습니다.');
    });

    it('403: 타인 카테고리 삭제 시도', async () => {
      const catRes = await request(app).post(CATEGORIES).set(authA()).send({ name: 'A의비밀카테고리' });
      const catId = catRes.body.id;

      const res = await request(app)
        .delete(`${CATEGORIES}/${catId}`)
        .set(authB());
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('접근 권한이 없습니다.');
    });

    it('409: 할일이 연결된 카테고리 삭제 시도 (BR-10)', async () => {
      const catRes = await request(app).post(CATEGORIES).set(authA()).send({ name: '할일있는카테고리' });
      const catId = catRes.body.id;

      // 할일 직접 삽입 (todo API를 아직 모르거나 연동 테스트 최소화)
      await pool.query(
        `INSERT INTO todos (id, user_id, category_id, title)
         VALUES (gen_random_uuid(), $1, $2, '테스트할일')`,
        [userAId, catId]
      );

      const res = await request(app)
        .delete(`${CATEGORIES}/${catId}`)
        .set(authA());
      expect(res.status).toBe(409);
      expect(res.body.status).toBe(409);
      expect(res.body.message).toBe('할일이 연결된 카테고리는 삭제할 수 없습니다.');
    });

    it('404: 존재하지 않는 카테고리 삭제', async () => {
      const res = await request(app)
        .delete(`${CATEGORIES}/00000000-0000-0000-0000-000000000000`)
        .set(authA());
      expect(res.status).toBe(404);
    });

    it('400: 잘못된 ID 형식', async () => {
      const res = await request(app)
        .delete(`${CATEGORIES}/invalid-uuid`)
        .set(authA());
      expect(res.status).toBe(400);
    });
  });
});
