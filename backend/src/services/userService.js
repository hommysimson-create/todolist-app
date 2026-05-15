'use strict';

const userRepository = require('../repositories/userRepository');
const { hashPassword } = require('../utils/hash');

async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    const err = new Error('사용자를 찾을 수 없습니다.');
    err.status = 404;
    throw err;
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    theme: user.theme,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

async function updateMe(userId, { name, password, theme }) {
  const fields = {};
  if (name !== undefined) fields.name = name;
  if (password !== undefined) fields.password = await hashPassword(password);
  if (theme !== undefined) fields.theme = theme;

  const updated = await userRepository.update(userId, fields);
  if (!updated) {
    const err = new Error('사용자를 찾을 수 없습니다.');
    err.status = 404;
    throw err;
  }
  return {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    theme: updated.theme,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  };
}

async function deleteMe(userId) {
  await userRepository.remove(userId);
}

module.exports = { getMe, updateMe, deleteMe };
