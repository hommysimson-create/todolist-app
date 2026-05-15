'use strict';

const userService = require('../services/userService');
const { isValidPassword, isValidName, isValidTheme } = require('../utils/validate');

async function getMe(req, res, next) {
  try {
    const user = await userService.getMe(req.user.userId);
    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const { name, password, theme, email } = req.body;

    // 이메일 수정 불가 (BR-12)
    if (email !== undefined) {
      return res.status(400).json({ status: 400, message: '이메일은 수정할 수 없습니다.' });
    }

    if (name !== undefined && !isValidName(name)) {
      return res.status(400).json({ status: 400, message: '이름은 1~100자여야 합니다.' });
    }
    if (password !== undefined && !isValidPassword(password)) {
      return res.status(400).json({ status: 400, message: '비밀번호는 최소 8자 이상이어야 합니다.' });
    }
    if (theme !== undefined && !isValidTheme(theme)) {
      return res.status(400).json({ status: 400, message: '테마는 light 또는 dark여야 합니다.' });
    }
    if (name === undefined && password === undefined && theme === undefined) {
      return res.status(400).json({ status: 400, message: '수정할 항목(name, password 또는 theme)이 필요합니다.' });
    }

    const user = await userService.updateMe(req.user.userId, { name, password, theme });
    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function deleteMe(req, res, next) {
  try {
    await userService.deleteMe(req.user.userId);
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe, deleteMe };
