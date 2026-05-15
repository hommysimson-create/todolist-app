'use strict';

const pool = require('../db/pool');

async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT id, email, password, name, theme, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );
  return rows[0] ?? null;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, email, name, theme, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

async function create({ email, password, name }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, theme, created_at, updated_at`,
    [email, password, name]
  );
  return rows[0];
}

/**
 * @param {string} id
 * @param {{ name?: string, password?: string, theme?: string }} fields - 최소 1개 필드 필요
 */
async function update(id, fields) {
  const setClauses = [];
  const values = [];
  let idx = 1;

  if (fields.name !== undefined) {
    setClauses.push(`name = $${idx++}`);
    values.push(fields.name);
  }
  if (fields.password !== undefined) {
    setClauses.push(`password = $${idx++}`);
    values.push(fields.password);
  }
  if (fields.theme !== undefined) {
    setClauses.push(`theme = $${idx++}`);
    values.push(fields.theme);
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx}
     RETURNING id, email, name, theme, created_at, updated_at`,
    values
  );
  return rows[0] ?? null;
}

async function remove(id) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

module.exports = { findByEmail, findById, create, update, remove };
