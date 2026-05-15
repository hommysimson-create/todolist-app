import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let css: string

beforeAll(() => {
  css = readFileSync(resolve(__dirname, '../styles/globals.css'), 'utf-8')
})

describe('globals.css — CSS 변수', () => {
  const colorVars = [
    '--color-primary',
    '--color-primary-hover',
    '--color-primary-light',
    '--color-text-primary',
    '--color-text-secondary',
    '--color-text-disabled',
    '--color-surface',
    '--color-background',
    '--color-border',
    '--color-hover',
    '--color-success',
    '--color-success-bg',
    '--color-error',
    '--color-error-bg',
    '--color-warning',
    '--color-warning-bg',
    '--color-info',
    '--color-info-bg',
  ]

  colorVars.forEach((token) => {
    it(`색상 변수 ${token}가 정의되어 있다`, () => {
      expect(css).toContain(token)
    })
  })

  const spaceVars = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-8', '--space-12']
  spaceVars.forEach((token) => {
    it(`간격 변수 ${token}가 정의되어 있다`, () => {
      expect(css).toContain(token)
    })
  })

  const radiusVars = ['--radius-sm', '--radius-md', '--radius-lg', '--radius-full']
  radiusVars.forEach((token) => {
    it(`반경 변수 ${token}가 정의되어 있다`, () => {
      expect(css).toContain(token)
    })
  })

  const shadowVars = ['--shadow-sm', '--shadow-md', '--shadow-lg']
  shadowVars.forEach((token) => {
    it(`그림자 변수 ${token}가 정의되어 있다`, () => {
      expect(css).toContain(token)
    })
  })

  const textVars = [
    '--text-heading-lg',
    '--text-heading-md',
    '--text-heading-sm',
    '--text-body-md',
    '--text-body-sm',
    '--text-label',
    '--text-button',
  ]
  textVars.forEach((token) => {
    it(`타이포그래피 변수 ${token}가 정의되어 있다`, () => {
      expect(css).toContain(token)
    })
  })

  it('--font-family가 정의되어 있다', () => {
    expect(css).toContain('--font-family')
  })
})

describe('globals.css — Breakpoint 미디어 쿼리', () => {
  it('Mobile breakpoint (max-width: 768px)가 정의되어 있다', () => {
    expect(css).toMatch(/max-width:\s*768px/)
  })

  it('Tablet breakpoint (769px ~ 1024px)가 정의되어 있다', () => {
    expect(css).toMatch(/min-width:\s*769px/)
    expect(css).toMatch(/max-width:\s*1024px/)
  })

  it('Desktop breakpoint (min-width: 1025px)가 정의되어 있다', () => {
    expect(css).toMatch(/min-width:\s*1025px/)
  })
})

describe('globals.css — Reset CSS 및 기본 스타일', () => {
  it('box-sizing reset이 정의되어 있다', () => {
    expect(css).toContain('box-sizing: border-box')
  })

  it('body margin reset이 정의되어 있다', () => {
    expect(css).toContain('margin: 0')
  })

  it('body font-family가 설정되어 있다', () => {
    expect(css).toContain('font-family: var(--font-family)')
  })

  it('콘텐츠 최대 너비(960px)가 정의되어 있다', () => {
    expect(css).toContain('960px')
  })
})
