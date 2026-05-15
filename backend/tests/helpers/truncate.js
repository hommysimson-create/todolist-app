'use strict';

// TRUNCATE ... CASCADE는 categories 테이블(기본 카테고리 포함)까지 삭제하므로
// DELETE 순서 방식을 사용해 기본 카테고리(is_default=true)를 보존한다.
async function truncateAll(pool) {
  await pool.query('DELETE FROM todos');
  await pool.query("DELETE FROM categories WHERE is_default = false");
  await pool.query('DELETE FROM users');
}

async function truncateTodos(pool) {
  await pool.query('DELETE FROM todos');
}

async function truncateUsers(pool) {
  await pool.query('DELETE FROM todos');
  await pool.query("DELETE FROM categories WHERE is_default = false");
  await pool.query('DELETE FROM users');
}

async function truncateCategories(pool) {
  // 기본 카테고리(is_default=true)는 보존, 사용자 정의 카테고리만 삭제
  await pool.query("DELETE FROM categories WHERE is_default = false");
}

module.exports = { truncateAll, truncateTodos, truncateUsers, truncateCategories };
