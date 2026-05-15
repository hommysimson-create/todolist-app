'use strict';

const express = require('express');
const request = require('supertest');
const errorHandler = require('../../src/middlewares/errorHandler');

function makeApp(errFactory) {
  const app = express();
  app.get('/test', (req, res, next) => next(errFactory()));
  app.use(errorHandler);
  return app;
}

function makeError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

describe('BE-02 · 에러 핸들링 미들웨어', () => {
  describe('HTTP 상태 코드별 JSON 응답', () => {
    const cases = [
      { status: 400, message: '잘못된 요청' },
      { status: 401, message: '인증 실패' },
      { status: 403, message: '접근 금지' },
      { status: 404, message: '없는 리소스' },
      { status: 409, message: '충돌 발생' },
    ];

    cases.forEach(({ status, message }) => {
      it(`${status} 에러 → status:${status}, 원본 메시지 반환`, async () => {
        const app = makeApp(() => makeError(message, status));
        const res = await request(app).get('/test');
        expect(res.status).toBe(status);
        expect(res.body).toMatchObject({ status, message });
      });
    });

    it('500 에러 → status:500, 상세 정보 미노출', async () => {
      const app = makeApp(() => makeError('DB 연결 실패: password authentication failed', 500));
      const res = await request(app).get('/test');
      expect(res.status).toBe(500);
      expect(res.body.status).toBe(500);
      expect(res.body.message).not.toContain('DB 연결 실패');
      expect(res.body.message).not.toContain('password');
    });

    it('500 에러 → 일반 메시지 반환', async () => {
      const app = makeApp(() => makeError('내부 오류', 500));
      const res = await request(app).get('/test');
      expect(res.body.message).toBe('서버 내부 오류가 발생했습니다.');
    });
  });

  describe('statusCode 필드도 인식', () => {
    it('err.statusCode로 상태 코드 설정 가능', async () => {
      const app = makeApp(() => {
        const err = new Error('없음');
        err.statusCode = 404;
        return err;
      });
      const res = await request(app).get('/test');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe(404);
    });
  });

  describe('알 수 없는 상태 코드 → 500으로 처리', () => {
    it('정의되지 않은 상태 코드(422)는 500으로 대체', async () => {
      const app = makeApp(() => makeError('처리 불가', 422));
      const res = await request(app).get('/test');
      expect(res.status).toBe(500);
      expect(res.body.status).toBe(500);
    });

    it('status 없는 에러는 500으로 처리', async () => {
      const app = makeApp(() => new Error('예상치 못한 오류'));
      const res = await request(app).get('/test');
      expect(res.status).toBe(500);
      expect(res.body.status).toBe(500);
    });
  });

  describe('응답 형식', () => {
    it('응답은 { status, message } 두 필드만 포함', async () => {
      const app = makeApp(() => makeError('테스트', 400));
      const res = await request(app).get('/test');
      expect(Object.keys(res.body)).toEqual(expect.arrayContaining(['status', 'message']));
      expect(res.body.stack).toBeUndefined();
    });

    it('스택 트레이스 미노출', async () => {
      const app = makeApp(() => makeError('에러', 500));
      const res = await request(app).get('/test');
      expect(res.body.stack).toBeUndefined();
    });
  });

  describe('메시지 없는 에러 → 기본 메시지 사용', () => {
    it('400 에러에 메시지 없으면 기본 메시지 반환', async () => {
      const app = makeApp(() => {
        const err = new Error();
        err.status = 400;
        err.message = '';
        return err;
      });
      const res = await request(app).get('/test');
      expect(res.body.message).toBe('잘못된 요청입니다.');
    });
  });
});
