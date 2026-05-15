'use strict';

const pool = require('../db/pool');

/** 기본 카테고리 전체 + 요청 사용자의 사용자 정의 카테고리 조회 (BR-09) */
async function findByUserIdAndDefault(userId) {
  const { rows } = await pool.query(
    `SELECT id, user_id, name, is_default, created_at
     FROM categories
     WHERE is_default = true OR user_id = $1
     ORDER BY is_default DESC, name ASC`,
    [userId]
  );
  return rows;
}

async function findByUserIdAndName(userId, name) {
  const { rows } = await pool.query(
    'SELECT id FROM categories WHERE user_id = $1 AND name = $2',
    [userId, name]
  );
  return rows[0] ?? null;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, user_id, name, is_default, created_at FROM categories WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

async function create({ userId, name }) {
  const { rows } = await pool.query(
    `INSERT INTO categories (user_id, name, is_default)
     VALUES ($1, $2, false)
     RETURNING id, user_id, name, is_default, created_at`,
    [userId, name]
  );
  return rows[0];
}

async function remove(id) {
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
}

module.exports = { findByUserIdAndDefault, findByUserIdAndName, findById, create, remove };
