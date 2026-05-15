import { describe, it, expect } from 'vitest'

describe('Environment Variables', () => {
  it('VITE_API_BASE_URL is defined', () => {
    expect(import.meta.env.VITE_API_BASE_URL).toBeDefined()
  })

  it('VITE_API_BASE_URL has a value', () => {
    // In test environment (Vitest), it might pick up .env or default values
    // We just want to ensure it's loaded.
    expect(typeof import.meta.env.VITE_API_BASE_URL).toBe('string')
  })
})
