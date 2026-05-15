import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '../utils/getErrorMessage'

describe('getErrorMessage', () => {
  it('Axios 에러에서 서버 메시지를 반환한다', () => {
    const error = {
      isAxiosError: true,
      response: { data: { message: '이미 사용 중인 이메일입니다.' } },
    }
    expect(getErrorMessage(error)).toBe('이미 사용 중인 이메일입니다.')
  })

  it('response.data.message가 없으면 기본 메시지를 반환한다', () => {
    const error = { isAxiosError: true, response: { data: {} } }
    expect(getErrorMessage(error)).toBe('요청 처리 중 오류가 발생했습니다.')
  })

  it('response가 없으면 기본 메시지를 반환한다', () => {
    const error = { isAxiosError: true, response: undefined }
    expect(getErrorMessage(error)).toBe('요청 처리 중 오류가 발생했습니다.')
  })

  it('일반 Error 객체에서 알 수 없는 오류 메시지를 반환한다', () => {
    expect(getErrorMessage(new Error('Something went wrong'))).toBe('알 수 없는 오류가 발생했습니다.')
  })

  it('unknown 타입에서 알 수 없는 오류 메시지를 반환한다', () => {
    expect(getErrorMessage(null)).toBe('알 수 없는 오류가 발생했습니다.')
    expect(getErrorMessage(undefined)).toBe('알 수 없는 오류가 발생했습니다.')
    expect(getErrorMessage('string error')).toBe('알 수 없는 오류가 발생했습니다.')
  })
})
