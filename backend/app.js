'use strict';

require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger/swagger.json');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const todoRoutes = require('./src/routes/todoRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`[REQ] ${req.method} ${req.url} → ${res.statusCode} (${Date.now() - start}ms)`);
    });
  }
  next();
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/categories', categoryRoutes);

app.use((req, res) => {
  res.status(404).json({ status: 404, message: '요청한 리소스를 찾을 수 없습니다.' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SERVER] 포트 ${PORT}에서 실행 중 (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
    console.log(`[SERVER] DB: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    console.log(`[SERVER] Swagger UI: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
