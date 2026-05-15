'use strict';

const pool = require('../db/pool');

/**
 * 사용자 할일 목록 조회 — 필터 조건 동적 적용 (UC-08)
 * @param {string} userId
 * @param {{ categoryId?: string, startDate?: string, endDate?: string, isCompleted?: boolean }} filters
 */
async function findByUserIdWithFilter(userId, filters = {}) {
  const conditions = ['t.user_id = $1'];
  const values = [userId];
  let idx = 2;

  if (filters.categoryId !== undefined) {
    conditions.push(`t.category_id = $${idx++}`);
    values.push(filters.categoryId);
  }
  if (filters.startDate !== undefined) {
    conditions.push(`t.due_date >= $${idx++}`);
    values.push(filters.startDate);
  }
  if (filters.endDate !== undefined) {
    conditions.push(`t.due_date <= $${idx++}`);
    values.push(filters.endDate);
  }
  if (filters.isCompleted !== undefined) {
    conditions.push(`t.is_completed = $${idx++}`);
    values.push(filters.isCompleted);
  }

  const { rows } = await pool.query(
    `SELECT t.id, t.user_id, t.category_id, t.title, t.description,
            t.due_date, t.is_completed, t.created_at, t.updated_at,
            c.name AS category_name
     FROM todos t
     JOIN categories c ON c.id = t.category_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY t.created_at DESC`,
    values
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT id, user_id, category_id, title, description,
            due_date, is_completed, created_at, updated_at
     FROM todos WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

async function create({ userId, categoryId, title, description, dueDate }) {
  const { rows } = await pool.query(
    `INSERT INTO todos (user_id, category_id, title, description, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, category_id, title, description,
               due_date, is_completed, created_at, updated_at`,
    [userId, categoryId, title, description ?? null, dueDate ?? null]
  );
  return rows[0];
}

/**
 * @param {string} id
 * @param {{ title?: string, description?: string|null, dueDate?: string|null, categoryId?: string }} fields
 */
async function update(id, fields) {
  const setClauses = [];
  const values = [];
  let idx = 1;

  if (fields.title !== undefined) {
    setClauses.push(`title = $${idx++}`);
    values.push(fields.title);
  }
  if (Object.prototype.hasOwnProperty.call(fields, 'description')) {
    setClauses.push(`description = $${idx++}`);
    values.push(fields.description);
  }
  if (Object.prototype.hasOwnProperty.call(fields, 'dueDate')) {
    setClauses.push(`due_date = $${idx++}`);
    values.push(fields.dueDate);
  }
  if (fields.categoryId !== undefined) {
    setClauses.push(`category_id = $${idx++}`);
    values.push(fields.categoryId);
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE todos SET ${setClauses.join(', ')} WHERE id = $${idx}
     RETURNING id, user_id, category_id, title, description,
               due_date, is_completed, created_at, updated_at`,
    values
  );
  return rows[0] ?? null;
}

async function remove(id) {
  await pool.query('DELETE FROM todos WHERE id = $1', [id]);
}

/** is_completed 토글 (BR-06: 완료 상태에서도 취소 가능) */
async function updateCompleted(id) {
  const { rows } = await pool.query(
    `UPDATE todos
     SET is_completed = NOT is_completed, updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, category_id, title, description,
               due_date, is_completed, created_at, updated_at`,
    [id]
  );
  return rows[0] ?? null;
}

async function countByCategoryId(categoryId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) FROM todos WHERE category_id = $1',
    [categoryId]
  );
  return parseInt(rows[0].count, 10);
}

module.exports = {
  findByUserIdWithFilter,
  findById,
  create,
  update,
  remove,
  updateCompleted,
  countByCategoryId,
};
