'use strict';

const categoryRepository = require('../repositories/categoryRepository');
const todoRepository = require('../repositories/todoRepository');

const log = process.env.NODE_ENV !== 'test' ? console.log : () => {};

function toDto(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

async function getCategories(userId) {
  log(`[CATEGORY] 목록 조회: userId=${userId}`);
  const rows = await categoryRepository.findByUserIdAndDefault(userId);
  log(`[CATEGORY] 목록 조회 완료: ${rows.length}건`);
  return rows.map(toDto);
}

async function createCategory(userId, name) {
  log(`[CATEGORY] 생성 시도: userId=${userId}, name=${name}`);
  const exists = await categoryRepository.findByUserIdAndName(userId, name);
  if (exists) {
    log(`[CATEGORY] 생성 실패 - 중복 이름: ${name}`);
    const err = new Error('이미 존재하는 카테고리 이름입니다.');
    err.status = 409;
    throw err;
  }
  const row = await categoryRepository.create({ userId, name });
  log(`[CATEGORY] 생성 완료: categoryId=${row.id}, name=${name}`);
  return toDto(row);
}

async function deleteCategory(userId, categoryId) {
  log(`[CATEGORY] 삭제 시도: userId=${userId}, categoryId=${categoryId}`);
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    const err = new Error('카테고리를 찾을 수 없습니다.');
    err.status = 404;
    throw err;
  }
  if (category.is_default) {
    const err = new Error('기본 카테고리는 삭제할 수 없습니다.');
    err.status = 403;
    throw err;
  }
  if (category.user_id !== userId) {
    const err = new Error('접근 권한이 없습니다.');
    err.status = 403;
    throw err;
  }
  const todoCount = await todoRepository.countByCategoryId(categoryId);
  if (todoCount > 0) {
    log(`[CATEGORY] 삭제 실패 - 연결된 할일 ${todoCount}건: categoryId=${categoryId}`);
    const err = new Error('할일이 연결된 카테고리는 삭제할 수 없습니다.');
    err.status = 409;
    throw err;
  }
  await categoryRepository.remove(categoryId);
  log(`[CATEGORY] 삭제 완료: categoryId=${categoryId}`);
}

module.exports = { getCategories, createCategory, deleteCategory, toDto };
