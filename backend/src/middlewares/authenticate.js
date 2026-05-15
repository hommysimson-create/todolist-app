'use strict';

const { verify } = require('../utils/jwt');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 401, message: '인증 토큰이 필요합니다.' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verify(token);
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 401, message: '토큰이 만료되었습니다.' });
    }
    return res.status(401).json({ status: 401, message: '유효하지 않은 토큰입니다.' });
  }
}

module.exports = authenticate;
