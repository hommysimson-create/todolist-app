'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const env = process.env.NODE_ENV || 'development';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  // NODE_ENV=test 이면 todolist_test, 그 외에는 todolist_dev 사용
  database: env === 'test'
    ? (process.env.DB_NAME_TEST || 'todolist_test')
    : (process.env.DB_NAME || 'todolist_dev'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

if (!dbConfig.password) {
  console.error('[DB] DB_PASSWORD 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

module.exports = dbConfig;
