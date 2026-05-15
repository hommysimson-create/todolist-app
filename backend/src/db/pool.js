'use strict';

const { Pool } = require('pg');
const dbConfig = require('./config');

const pool = new Pool(dbConfig);

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[DB] 커넥션 획득 (${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`);
  }
});

pool.on('error', (err) => {
  console.error('[DB] 유휴 클라이언트 오류:', err.message);
});

module.exports = pool;
