'use strict';

const KNOWN_STATUS_CODES = new Set([400, 401, 403, 404, 409, 500]);

const DEFAULT_MESSAGES = {
  400: '잘못된 요청입니다.',
  401: '인증이 필요합니다.',
  403: '접근 권한이 없습니다.',
  404: '요청한 리소스를 찾을 수 없습니다.',
  409: '리소스 충돌이 발생했습니다.',
  500: '서버 내부 오류가 발생했습니다.',
};

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = KNOWN_STATUS_CODES.has(err.status)
    ? err.status
    : KNOWN_STATUS_CODES.has(err.statusCode)
      ? err.statusCode
      : 500;

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.url} → ${status}`, err.stack || err.message);

  // 500 이상은 상세 정보를 클라이언트에 노출하지 않음
  const message = status >= 500
    ? DEFAULT_MESSAGES[500]
    : (err.message || DEFAULT_MESSAGES[status]);

  res.status(status).json({ status, message });
}

module.exports = errorHandler;
