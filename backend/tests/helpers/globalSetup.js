'use strict';

/**
 * Jest globalSetup: 테스트 DB에 기본 카테고리 시드 데이터가 없으면 삽입한다.
 * 이미 존재하면 스킵 (ON CONFLICT DO NOTHING).
 */
module.exports = async function globalSetup() {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
  process.env.NODE_ENV = 'test';

  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME_TEST || 'todolist_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    const { rows } = await pool.query(
      'SELECT count(*) FROM categories WHERE is_default = true'
    );
    if (Number(rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO categories (user_id, name, is_default) VALUES
          (NULL, '업무',   true),
          (NULL, '개인',   true),
          (NULL, '쇼핑',   true),
          (NULL, '건강',   true),
          (NULL, '학습',   true)
      `);
    }
  } catch (e) {
    // 테이블 없음 등 → 무시
  } finally {
    await pool.end();
  }
};
