'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-integration';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express = require('express');
const request = require('supertest');
const pool = require('../../src/db/pool');
const authRoutes = require('../../src/routes/authRoutes');
const categoryRoutes = require('../../src/routes/categoryRoutes');
const todoRoutes = require('../../src/routes/todoRoutes');
const errorHandler = require('../../src/middlewares/errorHandler');
const { truncateUsers } = require('../helpers/truncate');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/todos', todoRoutes);
  app.use(errorHandler);
  return app;
}

const REGISTER = '/api/auth/register';
const CATEGORIES = '/api/categories';
const TODOS = '/api/todos';

function getLocalDateString(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('Todo API Integration Tests (BE-23)', () => {
  let app;
  let tokenA, tokenB;
  let userAId, userBId;
  let defaultCategoryId, customCategoryAId, customCategoryBId;
  let todoAId, todoBId;

  beforeAll(async () => {
    app = makeApp();
    await truncateUsers(pool);

    // Create User A
    const resA = await request(app).post(REGISTER).send({
      email: 'user-a@example.com',
      password: 'password123',
      name: 'User A',
    });
    tokenA = resA.body.accessToken;
    userAId = resA.body.user.id;

    // Create User B
    const resB = await request(app).post(REGISTER).send({
      email: 'user-b@example.com',
      password: 'password123',
      name: 'User B',
    });
    tokenB = resB.body.accessToken;
    userBId = resB.body.user.id;

    // Get default category
    const catRes = await request(app)
      .get(CATEGORIES)
      .set('Authorization', `Bearer ${tokenA}`);
    defaultCategoryId = catRes.body.find(c => c.isDefault).id;

    // Create custom category for A
    const customCatARes = await request(app)
      .post(CATEGORIES)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Custom Category A' });
    customCategoryAId = customCatARes.body.id;

    // Create custom category for B
    const customCatBRes = await request(app)
      .post(CATEGORIES)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Custom Category B' });
    customCategoryBId = customCatBRes.body.id;

    // Seed some todos
    const todoARes = await request(app)
      .post(TODOS)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'User A Todo', categoryId: defaultCategoryId });
    todoAId = todoARes.body.id;

    const todoBRes = await request(app)
      .post(TODOS)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'User B Todo', categoryId: defaultCategoryId });
    todoBId = todoBRes.body.id;
  });

  afterAll(async () => {
    await truncateUsers(pool);
    await pool.end();
  });

  const authA = () => ({ Authorization: `Bearer ${tokenA}` });
  const authB = () => ({ Authorization: `Bearer ${tokenB}` });

  describe('GET /api/todos', () => {
    it('1. Authentication required (401)', async () => {
      const res = await request(app).get(TODOS);
      expect(res.status).toBe(401);
    });

    it('2. Own todos only (200) (BR-03)', async () => {
      const res = await request(app).get(TODOS).set(authA());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some(t => t.id === todoAId)).toBe(true);
      expect(res.body.some(t => t.id === todoBId)).toBe(false);
      res.body.forEach(t => expect(t.userId).toBe(userAId));
    });

    it('3. Filtering by category (200)', async () => {
      await request(app)
        .post(TODOS)
        .set(authA())
        .send({ title: 'Custom Cat Todo', categoryId: customCategoryAId });

      const res = await request(app)
        .get(`${TODOS}?categoryId=${customCategoryAId}`)
        .set(authA());
      
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].categoryId).toBe(customCategoryAId);
    });

    it('4. Filtering by completion status (200)', async () => {
      const completedTodoRes = await request(app)
        .post(TODOS)
        .set(authA())
        .send({ title: 'Completed Todo', categoryId: defaultCategoryId });
      await request(app)
        .patch(`${TODOS}/${completedTodoRes.body.id}/complete`)
        .set(authA());

      const res = await request(app)
        .get(`${TODOS}?isCompleted=true`)
        .set(authA());

      expect(res.status).toBe(200);
      res.body.forEach(t => expect(t.isCompleted).toBe(true));

      const res2 = await request(app)
        .get(`${TODOS}?isCompleted=false`)
        .set(authA());
      expect(res2.status).toBe(200);
      res2.body.forEach(t => expect(t.isCompleted).toBe(false));
    });

    it('Filtering by date range (200)', async () => {
      const dateTodoRes = await request(app)
        .post(TODOS)
        .set(authA())
        .send({ title: 'Date Todo', categoryId: defaultCategoryId, dueDate: '2026-05-15' });

      const res = await request(app)
        .get(`${TODOS}?startDate=2026-05-14&endDate=2026-05-16`)
        .set(authA());
      
      expect(res.status).toBe(200);
      expect(res.body.some(t => t.id === dateTodoRes.body.id)).toBe(true);
    });

    it('Response field verification (Swagger)', async () => {
      const res = await request(app).get(TODOS).set(authA());
      expect(res.status).toBe(200);
      if (res.body.length > 0) {
        const todo = res.body[0];
        expect(todo).toHaveProperty('id');
        expect(todo).toHaveProperty('userId');
        expect(todo).toHaveProperty('categoryId');
        expect(todo).toHaveProperty('title');
        expect(todo).toHaveProperty('isCompleted');
        expect(todo).toHaveProperty('createdAt');
        expect(todo).toHaveProperty('updatedAt');
      }
    });

    it('Invalid filter values (400)', async () => {
      await request(app).get(`${TODOS}?categoryId=not-uuid`).set(authA()).expect(400);
      await request(app).get(`${TODOS}?startDate=invalid`).set(authA()).expect(400);
      await request(app).get(`${TODOS}?endDate=invalid`).set(authA()).expect(400);
      await request(app).get(`${TODOS}?isCompleted=not-bool`).set(authA()).expect(400);
    });
  });

  describe('POST /api/todos', () => {
    it('5. Success (201)', async () => {
      const payload = {
        title: 'New Todo Success',
        categoryId: defaultCategoryId,
        description: 'Testing description',
        dueDate: '2026-05-20'
      };
      const res = await request(app)
        .post(TODOS)
        .set(authA())
        .send(payload);
      
      expect(res.status).toBe(201);
      expect(res.body.title).toBe(payload.title);
      expect(getLocalDateString(res.body.dueDate)).toBe(payload.dueDate);
    });

    it('6. Missing required values (title, categoryId) (400)', async () => {
      await request(app).post(TODOS).set(authA()).send({ categoryId: defaultCategoryId }).expect(400);
      await request(app).post(TODOS).set(authA()).send({ title: 'Missing' }).expect(400);
    });

    it('Invalid inputs (400)', async () => {
      await request(app).post(TODOS).set(authA()).send({ title: '', categoryId: defaultCategoryId }).expect(400);
      await request(app).post(TODOS).set(authA()).send({ title: 'T', categoryId: 'not-uuid' }).expect(400);
      await request(app).post(TODOS).set(authA()).send({ title: 'T', categoryId: defaultCategoryId, description: 123 }).expect(400);
      await request(app).post(TODOS).set(authA()).send({ title: 'T', categoryId: defaultCategoryId, dueDate: 'invalid' }).expect(400);
    });

    it('Attempt to use another user\'s custom category (400)', async () => {
      await request(app)
        .post(TODOS)
        .set(authA())
        .send({ title: 'Illegal Category', categoryId: customCategoryBId })
        .expect(400);
    });
  });

  describe('PATCH /api/todos/:id', () => {
    it('7. Other\'s todo (403)', async () => {
      await request(app)
        .patch(`${TODOS}/${todoBId}`)
        .set(authA())
        .send({ title: 'Illegal Update' })
        .expect(403);
    });

    it('Successful update (200)', async () => {
      const res = await request(app)
        .patch(`${TODOS}/${todoAId}`)
        .set(authA())
        .send({ title: 'Updated Title', description: 'Updated Desc', dueDate: '2026-12-25' });
      
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(getLocalDateString(res.body.dueDate)).toBe('2026-12-25');
    });

    it('Update with null values (200)', async () => {
      const res = await request(app)
        .patch(`${TODOS}/${todoAId}`)
        .set(authA())
        .send({ description: null, dueDate: null });
      expect(res.status).toBe(200);
      expect(res.body.description).toBeNull();
      expect(res.body.dueDate).toBeNull();
    });

    it('Update with another user\'s custom category (400)', async () => {
      await request(app)
        .patch(`${TODOS}/${todoAId}`)
        .set(authA())
        .send({ categoryId: customCategoryBId })
        .expect(400);
    });

    it('Invalid inputs for update (400)', async () => {
      await request(app).patch(`${TODOS}/not-uuid`).set(authA()).send({ title: 'T' }).expect(400);
      await request(app).patch(`${TODOS}/${todoAId}`).set(authA()).send({ categoryId: 'not-uuid' }).expect(400);
      await request(app).patch(`${TODOS}/${todoAId}`).set(authA()).send({}).expect(400);
      await request(app).patch(`${TODOS}/${todoAId}`).set(authA()).send({ dueDate: 'invalid' }).expect(400);
      await request(app).patch(`${TODOS}/${todoAId}`).set(authA()).send({ title: 'a'.repeat(256) }).expect(400);
    });

    it('Todo not found (404)', async () => {
      await request(app)
        .patch(`${TODOS}/00000000-0000-0000-0000-000000000000`)
        .set(authA())
        .send({ title: 'Missing' })
        .expect(404);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('Other\'s todo (403)', async () => {
      await request(app).delete(`${TODOS}/${todoBId}`).set(authA()).expect(403);
    });

    it('8. Success (204)', async () => {
      const tempTodo = await request(app)
        .post(TODOS)
        .set(authA())
        .send({ title: 'To Be Deleted', categoryId: defaultCategoryId });
      
      await request(app).delete(`${TODOS}/${tempTodo.body.id}`).set(authA()).expect(204);
    });

    it('Invalid ID (400)', async () => {
      await request(app).delete(`${TODOS}/not-uuid`).set(authA()).expect(400);
    });

    it('Todo not found (404)', async () => {
      await request(app).delete(`${TODOS}/00000000-0000-0000-0000-000000000000`).set(authA()).expect(404);
    });
  });

  describe('PATCH /api/todos/:id/complete', () => {
    it('9. Toggle completion (200)', async () => {
      const todo = await request(app)
        .post(TODOS)
        .set(authA())
        .send({ title: 'Toggle Test', categoryId: defaultCategoryId });
      
      const res1 = await request(app).patch(`${TODOS}/${todo.body.id}/complete`).set(authA());
      expect(res1.status).toBe(200);
      expect(res1.body.isCompleted).toBe(true);

      const res2 = await request(app).patch(`${TODOS}/${todo.body.id}/complete`).set(authA());
      expect(res2.status).toBe(200);
      expect(res2.body.isCompleted).toBe(false);
    });

    it('Other\'s todo toggle (403)', async () => {
      await request(app).patch(`${TODOS}/${todoBId}/complete`).set(authA()).expect(403);
    });

    it('Invalid ID (400)', async () => {
      await request(app).patch(`${TODOS}/not-uuid/complete`).set(authA()).expect(400);
    });

    it('Todo not found (404)', async () => {
      await request(app).patch(`${TODOS}/00000000-0000-0000-0000-000000000000/complete`).set(authA()).expect(404);
    });
  });
});
