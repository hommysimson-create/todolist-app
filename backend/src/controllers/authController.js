'use strict';

const authService = require('../services/authService');
const { isValidEmail, isValidPassword, isValidName } = require('../utils/validate');

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ status: 400, message: '유효한 이메일 형식이 아닙니다.' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ status: 400, message: '비밀번호는 최소 8자 이상이어야 합니다.' });
    }
    if (!isValidName(name)) {
      return res.status(400).json({ status: 400, message: '이름은 1~100자여야 합니다.' });
    }

    const result = await authService.register({ email, password, name });
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ status: 400, message: '유효한 이메일 형식이 아닙니다.' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ status: 400, message: '비밀번호는 최소 8자 이상이어야 합니다.' });
    }

    const result = await authService.login({ email, password });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
