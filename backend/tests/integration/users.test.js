'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-integration';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express = require('express');
const request = require('supertest');
const pool = require('../../src/db/pool');
const authRoutes = require('../../src/routes/authRoutes');
const userRoutes = require('../../src/routes/userRoutes');
const errorHandler = require('../../src/middlewares/errorHandler');
const { truncateUsers } = require('../helpers/truncate');
const { comparePassword } = require('../../src/utils/hash');
const userRepository = require('../../src/repositories/userRepository');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use(errorHandler);
  return app;
}

const REGISTER = '/api/auth/register';
const ME = '/api/users/me';

describe('User API Integration Tests (GET/PATCH/DELETE /api/users/me)', () => {
  let app;
  let token;
  let userId;

  const TEST_USER = {
    email: 'integration-test@example.com',
    password: 'password123',
    name: '테스트유저',
  };

  beforeAll(async () => {
    app = makeApp();
  });

  beforeEach(async () => {
    await truncateUsers(pool);
    const res = await request(app).post(REGISTER).send(TEST_USER);
    token = res.body.accessToken;
    userId = res.body.user.id;
  });

  afterAll(async () => {
    await truncateUsers(pool);
    await pool.end();
  });

  const auth = (t = token) => ({ Authorization: `Bearer ${t}` });

  describe('GET /api/users/me', () => {
    it('Success (200) - returns current user info without password', async () => {
      const res = await request(app)
        .get(ME)
        .set(auth());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('email', TEST_USER.email);
      expect(res.body).toHaveProperty('name', TEST_USER.name);
      expect(res.body).toHaveProperty('theme', 'light'); // Default value
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('updatedAt');
      expect(res.body.password).toBeUndefined();

      // Swagger check: required fields ["id", "email", "name", "createdAt", "updatedAt"]
      const requiredFields = ['id', 'email', 'name', 'createdAt', 'updatedAt'];
      requiredFields.forEach(field => {
        expect(res.body).toHaveProperty(field);
      });
    });

    it('Unauthorized (401) - missing token', async () => {
      const res = await request(app).get(ME);
      expect(res.status).toBe(401);
    });

    it('Unauthorized (401) - invalid token', async () => {
      const res = await request(app)
        .get(ME)
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });

    it('Not Found (404) - user exists in token but not in DB', async () => {
      // Delete the user first
      await userRepository.remove(userId);

      const res = await request(app)
        .get(ME)
        .set(auth());
      
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('찾을 수 없습니다');
    });
  });

  describe('PATCH /api/users/me', () => {
    it('Success (200) - name update', async () => {
      const newName = '업데이트된이름';
      const res = await request(app)
        .patch(ME)
        .set(auth())
        .send({ name: newName });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(newName);
      
      // Verify via GET
      const getRes = await request(app).get(ME).set(auth());
      expect(getRes.body.name).toBe(newName);
    });

    it('Success (200) - theme update', async () => {
      const newTheme = 'dark';
      const res = await request(app)
        .patch(ME)
        .set(auth())
        .send({ theme: newTheme });

      expect(res.status).toBe(200);
      expect(res.body.theme).toBe(newTheme);
      
      // Verify via GET
      const getRes = await request(app).get(ME).set(auth());
      expect(getRes.body.theme).toBe(newTheme);
    });

    it('Validation Error (400) - invalid theme value', async () => {
      const res = await request(app)
        .patch(ME)
        .set(auth())
        .send({ theme: 'blue' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('테마');
    });

    it('Success (200) - password update', async () => {
      const newPassword = 'newsecurepassword123';
      const res = await request(app)
        .patch(ME)
        .set(auth())
        .send({ password: newPassword });

      expect(res.status).toBe(200);
      
      // Verify using bcrypt comparison
      const user = await userRepository.findByEmail(TEST_USER.email);
      const isMatch = await comparePassword(newPassword, user.password);
      expect(isMatch).toBe(true);
    });

    it('Validation Error (400) - password < 8 chars', async () => {
      const res = await request(app)
        .patch(ME)
        .set(auth())
        .send({ password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('8자');
    });

    it('Validation Error (400) - email update attempt (BR-12)', async () => {
      const res = await request(app)
        .patch(ME)
        .set(auth())
        .send({ email: 'new@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('이메일');
    });

    it('Validation Error (400) - missing fields (empty body)', async () => {
      const res = await request(app)
        .patch(ME)
        .set(auth())
        .send({});

      expect(res.status).toBe(400);
    });

    it('Validation Error (400) - name too short', async () => {
      const res = await request(app)
        .patch(ME)
        .set(auth())
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('Not Found (404) - user exists in token but not in DB', async () => {
      // Delete the user first
      await userRepository.remove(userId);

      const res = await request(app)
        .patch(ME)
        .set(auth())
        .send({ name: '신규이름' });
      
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('찾을 수 없습니다');
    });
  });

  describe('DELETE /api/users/me', () => {
    it('Success (204) - user deletion', async () => {
      const res = await request(app)
        .delete(ME)
        .set(auth());

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});

      // Verify user is gone
      const user = await userRepository.findByEmail(TEST_USER.email);
      expect(user).toBeNull();
    });

    it('Unauthorized (401) - missing token', async () => {
      const res = await request(app).delete(ME);
      expect(res.status).toBe(401);
    });

    it('CASCADE DELETE verification - todos and custom categories are deleted', async () => {
      // 1. Create a custom category
      const catRes = await pool.query(
        `INSERT INTO categories (user_id, name, is_default) VALUES ($1, 'CASCADE테스트', false) RETURNING id`,
        [userId]
      );
      const categoryId = catRes.rows[0].id;

      // 2. Create a todo in that category
      await pool.query(
        `INSERT INTO todos (user_id, category_id, title) VALUES ($1, $2, $3)`,
        [userId, categoryId, '테스트 할일']
      );

      // 3. Delete user
      await request(app)
        .delete(ME)
        .set(auth());

      // 4. Verify CASCADE deletion
      const todosRes = await pool.query('SELECT id FROM todos WHERE user_id = $1', [userId]);
      const catsRes = await pool.query('SELECT id FROM categories WHERE user_id = $1', [userId]);
      
      expect(todosRes.rows).toHaveLength(0);
      expect(catsRes.rows).toHaveLength(0);
    });
  });
});
