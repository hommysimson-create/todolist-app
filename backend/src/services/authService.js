'use strict';

const userRepository = require('../repositories/userRepository');
const { hashPassword, comparePassword } = require('../utils/hash');
const { sign } = require('../utils/jwt');

const log = process.env.NODE_ENV !== 'test' ? console.log : () => {};

async function register({ email, password, name }) {
  log(`[AUTH] 회원가입 시도: ${email}`);
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    log(`[AUTH] 회원가입 실패 - 중복 이메일: ${email}`);
    const err = new Error('이미 사용 중인 이메일입니다.');
    err.status = 409;
    throw err;
  }

  const hashed = await hashPassword(password);
  const user = await userRepository.create({ email, password: hashed, name });

  const accessToken = sign({ userId: user.id, email: user.email });
  log(`[AUTH] 회원가입 완료: userId=${user.id}, email=${email}`);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      theme: user.theme,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
  };
}

async function login({ email, password }) {
  log(`[AUTH] 로그인 시도: ${email}`);
  const user = await userRepository.findByEmail(email);

  const INVALID_ERR = () => {
    const err = new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    err.status = 401;
    return err;
  };

  if (!user) {
    log(`[AUTH] 로그인 실패 - 존재하지 않는 이메일: ${email}`);
    throw INVALID_ERR();
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    log(`[AUTH] 로그인 실패 - 비밀번호 불일치: ${email}`);
    throw INVALID_ERR();
  }

  const accessToken = sign({ userId: user.id, email: user.email });
  log(`[AUTH] 로그인 성공: userId=${user.id}, email=${email}`);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      theme: user.theme,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
  };
}

module.exports = { register, login };
