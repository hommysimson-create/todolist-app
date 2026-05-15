'use strict';

process.env.JWT_SECRET = 'test-secret-for-unit-test';

const { sign, verify } = require('../../src/utils/jwt');
const jwt = require('jsonwebtoken');

describe('BE-03 · jwt.js 유틸', () => {
  describe('sign()', () => {
    it('payload로 JWT 토큰 생성', () => {
      const token = sign({ userId: 'u1', email: 'test@example.com' });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('생성된 토큰에 payload 포함', () => {
      const token = sign({ userId: 'u1', email: 'a@b.com' });
      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe('u1');
      expect(decoded.email).toBe('a@b.com');
    });

    it('만료 시간 1h 포함', () => {
      const before = Math.floor(Date.now() / 1000);
      const token = sign({ userId: 'u1' });
      const decoded = jwt.decode(token);
      expect(decoded.exp - decoded.iat).toBe(3600);
      expect(decoded.iat).toBeGreaterThanOrEqual(before);
    });
  });

  describe('verify()', () => {
    it('유효한 토큰 검증 성공 → payload 반환', () => {
      const token = sign({ userId: 'u2', email: 'b@c.com' });
      const payload = verify(token);
      expect(payload.userId).toBe('u2');
      expect(payload.email).toBe('b@c.com');
    });

    it('잘못된 토큰 → 에러 throw', () => {
      expect(() => verify('invalid.token.here')).toThrow();
    });

    it('다른 secret으로 서명된 토큰 → 에러 throw', () => {
      const fakeToken = jwt.sign({ userId: 'u3' }, 'wrong-secret', { expiresIn: '1h' });
      expect(() => verify(fakeToken)).toThrow();
    });

    it('만료된 토큰 → TokenExpiredError throw', () => {
      const expiredToken = jwt.sign({ userId: 'u4' }, 'test-secret-for-unit-test', { expiresIn: -1 });
      expect(() => verify(expiredToken)).toThrow(expect.objectContaining({ name: 'TokenExpiredError' }));
    });
  });

  describe('JWT_SECRET 미설정 시', () => {
    it('sign 호출 시 에러 throw', () => {
      const original = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      expect(() => sign({ userId: 'u5' })).toThrow('JWT_SECRET');
      process.env.JWT_SECRET = original;
    });

    it('verify 호출 시 에러 throw', () => {
      const original = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      expect(() => verify('some.token.here')).toThrow('JWT_SECRET');
      process.env.JWT_SECRET = original;
    });
  });
});
