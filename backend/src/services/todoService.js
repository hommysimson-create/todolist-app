'use strict';

const todoRepository = require('../repositories/todoRepository');
const categoryRepository = require('../repositories/categoryRepository');

const log = process.env.NODE_ENV !== 'test' ? console.log : () => {};

function toDto(row) {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    isCompleted: row.is_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getTodos(userId, filters) {
  log(`[TODO] 목록 조회: userId=${userId}, filters=${JSON.stringify(filters)}`);
  const rows = await todoRepository.findByUserIdWithFilter(userId, filters);
  log(`[TODO] 목록 조회 완료: ${rows.length}건`);
  return rows.map(toDto);
}

async function createTodo(userId, { title, categoryId, description, dueDate }) {
  log(`[TODO] 생성 시도: userId=${userId}, title=${title}, categoryId=${categoryId}`);
  const category = await categoryRepository.findById(categoryId);

  if (!category) {
    const err = new Error('존재하지 않는 카테고리입니다.');
    err.status = 400;
    throw err;
  }

  if (category.is_default === false && category.user_id !== userId) {
    const err = new Error('접근할 수 없는 카테고리입니다.');
    err.status = 400;
    throw err;
  }

  const row = await todoRepository.create({
    userId,
    categoryId,
    title,
    description: description ?? null,
    dueDate: dueDate ?? null,
  });

  log(`[TODO] 생성 완료: todoId=${row.id}, title=${title}`);
  return toDto({ ...row, category_name: category.name });
}

async function updateTodo(userId, todoId, fields) {
  log(`[TODO] 수정 시도: userId=${userId}, todoId=${todoId}, fields=${JSON.stringify(Object.keys(fields))}`);
  const existing = await todoRepository.findById(todoId);
  if (!existing) {
    const err = new Error('할일을 찾을 수 없습니다.');
    err.status = 404;
    throw err;
  }
  if (existing.user_id !== userId) {
    const err = new Error('접근 권한이 없습니다.');
    err.status = 403;
    throw err;
  }
  if (fields.categoryId !== undefined) {
    const category = await categoryRepository.findById(fields.categoryId);
    if (!category) {
      const err = new Error('존재하지 않는 카테고리입니다.');
      err.status = 400;
      throw err;
    }
    if (category.is_default === false && category.user_id !== userId) {
      const err = new Error('접근할 수 없는 카테고리입니다.');
      err.status = 400;
      throw err;
    }
  }
  const row = await todoRepository.update(todoId, fields);
  const category = await categoryRepository.findById(row.category_id);
  log(`[TODO] 수정 완료: todoId=${todoId}`);
  return toDto({ ...row, category_name: category ? category.name : null });
}

async function deleteTodo(userId, todoId) {
  log(`[TODO] 삭제 시도: userId=${userId}, todoId=${todoId}`);
  const existing = await todoRepository.findById(todoId);
  if (!existing) {
    const err = new Error('할일을 찾을 수 없습니다.');
    err.status = 404;
    throw err;
  }
  if (existing.user_id !== userId) {
    const err = new Error('접근 권한이 없습니다.');
    err.status = 403;
    throw err;
  }
  await todoRepository.remove(todoId);
  log(`[TODO] 삭제 완료: todoId=${todoId}`);
}

async function toggleTodoComplete(userId, todoId) {
  log(`[TODO] 완료 토글: userId=${userId}, todoId=${todoId}`);
  const existing = await todoRepository.findById(todoId);
  if (!existing) {
    const err = new Error('할일을 찾을 수 없습니다.');
    err.status = 404;
    throw err;
  }
  if (existing.user_id !== userId) {
    const err = new Error('접근 권한이 없습니다.');
    err.status = 403;
    throw err;
  }
  const row = await todoRepository.updateCompleted(todoId);
  const category = await categoryRepository.findById(row.category_id);
  log(`[TODO] 완료 토글 결과: todoId=${todoId}, isCompleted=${row.is_completed}`);
  return toDto({ ...row, category_name: category ? category.name : null });
}

module.exports = { getTodos, createTodo, updateTodo, deleteTodo, toggleTodoComplete, toDto };
