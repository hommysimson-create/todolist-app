'use strict';

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../../src');

describe('BE-01 · 프로젝트 초기 셋업', () => {
  describe('디렉토리 구조', () => {
    const requiredDirs = [
      'routes', 'controllers', 'services',
      'repositories', 'middlewares', 'db', 'utils',
    ];
    requiredDirs.forEach((dir) => {
      it(`src/${dir} 디렉토리 존재`, () => {
        expect(fs.existsSync(path.join(SRC, dir))).toBe(true);
      });
    });
  });

  describe('package.json 의존성', () => {
    const pkg = require('../../package.json');

    it('name이 todolist-backend', () => {
      expect(pkg.name).toBe('todolist-backend');
    });

    const requiredDeps = ['express', 'pg', 'jsonwebtoken', 'bcrypt', 'dotenv'];
    requiredDeps.forEach((dep) => {
      it(`dependencies에 ${dep} 포함`, () => {
        expect(pkg.dependencies).toHaveProperty(dep);
      });
    });

    const requiredDevDeps = ['jest', 'supertest', 'nodemon'];
    requiredDevDeps.forEach((dep) => {
      it(`devDependencies에 ${dep} 포함`, () => {
        expect(pkg.devDependencies).toHaveProperty(dep);
      });
    });

    it('type이 commonjs', () => {
      expect(pkg.type).toBe('commonjs');
    });
  });

  describe('핵심 모듈 로드', () => {
    it('db/config.js 로드 가능', () => {
      process.env.DB_PASSWORD = 'test';
      expect(() => require('../../src/db/config')).not.toThrow();
    });

    it('repositories 3개 로드 가능', () => {
      expect(() => require('../../src/repositories/userRepository')).not.toThrow();
      expect(() => require('../../src/repositories/categoryRepository')).not.toThrow();
      expect(() => require('../../src/repositories/todoRepository')).not.toThrow();
    });

    it('jest.config.js 존재', () => {
      expect(fs.existsSync(path.resolve(__dirname, '../../jest.config.js'))).toBe(true);
    });
  });

  describe('.env.example 키 확인', () => {
    const envExamplePath = path.resolve(__dirname, '../../../.env.example');
    it('.env.example 파일 존재', () => {
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    it('필수 환경 변수 키 포함', () => {
      const content = fs.readFileSync(envExamplePath, 'utf-8');
      ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
       'NODE_ENV', 'PORT', 'JWT_SECRET', 'JWT_EXPIRES_IN'].forEach((key) => {
        expect(content).toContain(key);
      });
    });
  });
});
