'use strict';

const {
  isValidEmail,
  isValidPassword,
  isValidUUID,
  isValidDate,
  isValidName,
  isValidTitle,
} = require('../../src/utils/validate');

describe('BE-05 · validate.js 유틸', () => {
  describe('isValidEmail()', () => {
    it.each([
      'user@example.com',
      'user.name+tag@sub.domain.com',
      'a@b.co',
    ])('유효한 이메일 "%s" → true', (email) => {
      expect(isValidEmail(email)).toBe(true);
    });

    it.each([
      'notanemail',
      '@nodomain.com',
      'no-at-sign',
      'missing@',
      '',
      'spaces @example.com',
    ])('유효하지 않은 이메일 "%s" → false', (email) => {
      expect(isValidEmail(email)).toBe(false);
    });

    it('null/undefined → false', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
    });

    it('숫자 타입 → false', () => {
      expect(isValidEmail(123)).toBe(false);
    });
  });

  describe('isValidPassword()', () => {
    it('8자 비밀번호 → true', () => {
      expect(isValidPassword('12345678')).toBe(true);
    });

    it('8자 초과 비밀번호 → true', () => {
      expect(isValidPassword('superSecurePassword!')).toBe(true);
    });

    it('7자 비밀번호 → false (최소 8자)', () => {
      expect(isValidPassword('1234567')).toBe(false);
    });

    it('빈 문자열 → false', () => {
      expect(isValidPassword('')).toBe(false);
    });

    it('null/undefined → false', () => {
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
    });
  });

  describe('isValidUUID()', () => {
    it('유효한 UUID v4 → true', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('대소문자 혼합 UUID → true', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('잘못된 UUID (짧음) → false', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
    });

    it('UUID 형식이 아닌 문자열 → false', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
    });

    it('빈 문자열 → false', () => {
      expect(isValidUUID('')).toBe(false);
    });

    it('null → false', () => {
      expect(isValidUUID(null)).toBe(false);
    });
  });

  describe('isValidDate()', () => {
    it('유효한 날짜 YYYY-MM-DD → true', () => {
      expect(isValidDate('2026-05-13')).toBe(true);
    });

    it('윤년 날짜 → true', () => {
      expect(isValidDate('2024-02-29')).toBe(true);
    });

    it('형식이 다른 날짜 → false', () => {
      expect(isValidDate('2026/05/13')).toBe(false);
      expect(isValidDate('13-05-2026')).toBe(false);
      expect(isValidDate('20260513')).toBe(false);
    });

    it('존재하지 않는 월 → false', () => {
      expect(isValidDate('2026-13-01')).toBe(false);
    });

    it('빈 문자열 → false', () => {
      expect(isValidDate('')).toBe(false);
    });

    it('null → false', () => {
      expect(isValidDate(null)).toBe(false);
    });
  });

  describe('isValidName()', () => {
    it('1자 이름 → true', () => {
      expect(isValidName('홍')).toBe(true);
    });

    it('100자 이름 → true', () => {
      expect(isValidName('a'.repeat(100))).toBe(true);
    });

    it('일반 이름 → true', () => {
      expect(isValidName('홍길동')).toBe(true);
    });

    it('빈 문자열 → false', () => {
      expect(isValidName('')).toBe(false);
    });

    it('101자 이름 → false', () => {
      expect(isValidName('a'.repeat(101))).toBe(false);
    });

    it('null → false', () => {
      expect(isValidName(null)).toBe(false);
    });
  });

  describe('isValidTitle()', () => {
    it('1자 제목 → true', () => {
      expect(isValidTitle('할')).toBe(true);
    });

    it('255자 제목 → true', () => {
      expect(isValidTitle('a'.repeat(255))).toBe(true);
    });

    it('일반 제목 → true', () => {
      expect(isValidTitle('오늘 할 일 목록')).toBe(true);
    });

    it('빈 문자열 → false', () => {
      expect(isValidTitle('')).toBe(false);
    });

    it('256자 제목 → false', () => {
      expect(isValidTitle('a'.repeat(256))).toBe(false);
    });

    it('null → false', () => {
      expect(isValidTitle(null)).toBe(false);
    });
  });

  describe('module.exports 확인', () => {
    it('6개 함수 모두 export', () => {
      const mod = require('../../src/utils/validate');
      expect(typeof mod.isValidEmail).toBe('function');
      expect(typeof mod.isValidPassword).toBe('function');
      expect(typeof mod.isValidUUID).toBe('function');
      expect(typeof mod.isValidDate).toBe('function');
      expect(typeof mod.isValidName).toBe('function');
      expect(typeof mod.isValidTitle).toBe('function');
    });
  });
});
