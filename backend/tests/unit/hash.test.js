'use strict';

const bcrypt = require('bcrypt');
const { hashPassword, comparePassword } = require('../../src/utils/hash');

describe('BE-04 · hash.js 유틸', () => {
  describe('hashPassword()', () => {
    it('반환값은 문자열', async () => {
      const hash = await hashPassword('password123');
      expect(typeof hash).toBe('string');
    });

    it('평문 비밀번호와 다른 해시 반환', async () => {
      const hash = await hashPassword('password123');
      expect(hash).not.toBe('password123');
    });

    it('bcrypt 형식 해시 생성 ($2b$ 접두사)', async () => {
      const hash = await hashPassword('securePass!');
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('saltRounds 12 적용 ($2b$12$)', async () => {
      const hash = await hashPassword('myPassword');
      expect(hash.startsWith('$2b$12$')).toBe(true);
    });

    it('동일 평문으로 두 번 해시 → 서로 다른 결과 (salt 랜덤)', async () => {
      const hash1 = await hashPassword('samePassword');
      const hash2 = await hashPassword('samePassword');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword()', () => {
    it('일치하는 비밀번호 → true', async () => {
      const hash = await hashPassword('correct-password');
      const result = await comparePassword('correct-password', hash);
      expect(result).toBe(true);
    });

    it('틀린 비밀번호 → false', async () => {
      const hash = await hashPassword('correct-password');
      const result = await comparePassword('wrong-password', hash);
      expect(result).toBe(false);
    });

    it('빈 문자열 비밀번호 → false', async () => {
      const hash = await hashPassword('some-password');
      const result = await comparePassword('', hash);
      expect(result).toBe(false);
    });

    it('직접 생성한 bcrypt 해시와도 비교 가능', async () => {
      const directHash = await bcrypt.hash('directTest', 12);
      const result = await comparePassword('directTest', directHash);
      expect(result).toBe(true);
    });
  });

  describe('로그 보안', () => {
    it('hashPassword 호출 시 평문 비밀번호 console.log 미출력', async () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await hashPassword('secretPassword123');
      const calls = spy.mock.calls.flat().join(' ');
      expect(calls).not.toContain('secretPassword123');
      spy.mockRestore();
    });

    it('comparePassword 호출 시 평문 비밀번호 console.log 미출력', async () => {
      const hash = await hashPassword('anotherSecret');
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await comparePassword('anotherSecret', hash);
      const calls = spy.mock.calls.flat().join(' ');
      expect(calls).not.toContain('anotherSecret');
      spy.mockRestore();
    });
  });
});
