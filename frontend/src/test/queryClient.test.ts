import { describe, it, expect } from 'vitest'
import { queryClient } from '../config/queryClient'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient', () => {
  it('QueryClient 인스턴스여야 한다', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('retry 옵션이 1이어야 한다', () => {
    const options = queryClient.getDefaultOptions()
    expect(options.queries?.retry).toBe(1)
  })

  it('staleTime이 5분(300000ms)이어야 한다', () => {
    const options = queryClient.getDefaultOptions()
    expect(options.queries?.staleTime).toBe(5 * 60 * 1000)
  })
})
