import { describe, it, expect } from 'vitest'
import { defaultSerializers } from './serializers'

describe('Serializers', () => {
  describe('error serializer', () => {
    it('should serialize basic error', () => {
      const error = new Error('Test error')
      const result = defaultSerializers.error?.(error)

      expect(result).toMatchObject({
        type: 'Error',
        message: 'Test error',
      })
      expect(result?.stack).toBeDefined()
      expect(typeof result?.stack).toBe('string')
    })

    it('should serialize custom error properties', () => {
      const error = new Error('Custom error') as Error & { code: string; statusCode: number }
      error.code = 'ERR_CUSTOM'
      error.statusCode = 500

      const result = defaultSerializers.error?.(error)

      expect(result).toMatchObject({
        type: 'Error',
        message: 'Custom error',
        code: 'ERR_CUSTOM',
        statusCode: 500,
      })
    })

    it('should serialize nested error causes', () => {
      const rootCause = new Error('Root cause')
      const error = Object.assign(new Error('Main error'), { cause: rootCause })

      const result = defaultSerializers.error?.(error)

      expect(result?.cause).toBeDefined()
      expect(result?.cause).toMatchObject({
        type: 'Error',
        message: 'Root cause',
      })
    })

    it('should handle custom error types', () => {
      class CustomError extends Error {
        constructor(
          message: string,
          public code: string
        ) {
          super(message)
          this.name = 'CustomError'
        }
      }

      const error = new CustomError('Custom error', 'CUSTOM_CODE')
      const result = defaultSerializers.error?.(error)

      expect(result).toMatchObject({
        type: 'CustomError',
        message: 'Custom error',
        code: 'CUSTOM_CODE',
      })
    })

    it('should not include standard error fields as duplicates', () => {
      const error = new Error('Test error')
      const result = defaultSerializers.error?.(error)

      // These should be in the serialized object
      expect(result?.message).toBe('Test error')
      expect(result?.stack).toBeDefined()

      // But name should not be duplicated (it's the type)
      expect(result?.name).toBeUndefined()
    })

    it('should not leak sensitive custom properties', () => {
      const error = new Error('Error') as Error & { password: string; apiKey: string; code: string }
      error.password = 'secret123'
      error.apiKey = 'key-12345'
      error.code = 'ERR_AUTH' // This should be included (safe)

      const result = defaultSerializers.error?.(error)

      // Safe property should be included
      expect(result?.code).toBe('ERR_AUTH')

      // Sensitive properties should NOT be included
      expect(result?.password).toBeUndefined()
      expect(result?.apiKey).toBeUndefined()
    })

    it('should handle deep cause chains without stack overflow', () => {
      // Create a deep chain of errors
      let error: Error = new Error('Root cause')
      for (let i = 0; i < 15; i++) {
        error = Object.assign(new Error(`Level ${i}`), { cause: error })
      }

      const result = defaultSerializers.error?.(error)

      // Should not throw and should truncate deep chains
      expect(result).toBeDefined()
      expect(result?.message).toBe('Level 14')

      // Follow cause chain to verify truncation
      let current = result
      let depth = 0
      while (current?.cause && typeof current.cause === 'object') {
        current = current.cause as typeof result
        depth++
        if (depth > 15) break // Safety check
      }

      // Should have truncated before max depth
      expect(depth).toBeLessThanOrEqual(10)
    })
  })

  describe('request serializer', () => {
    it('should serialize HTTP request', () => {
      const req = {
        id: 'req-123',
        method: 'GET',
        url: '/api/users',
        headers: {
          host: 'example.com',
          'user-agent': 'test-agent',
          'content-type': 'application/json',
          authorization: 'Bearer token',
        },
        remoteAddress: '127.0.0.1',
        remotePort: 12345,
      }

      const result = defaultSerializers.request?.(req)

      expect(result).toMatchObject({
        id: 'req-123',
        method: 'GET',
        url: '/api/users',
        remoteAddress: '127.0.0.1',
        remotePort: 12345,
      })

      // Should only include safe headers
      expect(result?.headers).toMatchObject({
        host: 'example.com',
        'user-agent': 'test-agent',
        'content-type': 'application/json',
      })
      expect((result?.headers as Record<string, unknown>)?.authorization).toBeUndefined()
    })

    it('should handle minimal request object', () => {
      const req = { method: 'POST' }
      const result = defaultSerializers.request?.(req)

      expect(result).toMatchObject({ method: 'POST' })
    })

    it('should handle non-object input', () => {
      expect(defaultSerializers.request?.(null)).toEqual({})
      expect(defaultSerializers.request?.(undefined)).toEqual({})
      expect(defaultSerializers.request?.('string')).toEqual({})
    })
  })

  describe('response serializer', () => {
    it('should serialize HTTP response', () => {
      const res = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
          'content-length': '1234',
          'x-custom-header': 'value',
        },
      }

      const result = defaultSerializers.response?.(res)

      expect(result).toMatchObject({
        statusCode: 200,
      })

      // Should only include safe headers
      expect(result?.headers).toMatchObject({
        'content-type': 'application/json',
        'content-length': '1234',
      })
      expect((result?.headers as Record<string, unknown>)?.['x-custom-header']).toBeUndefined()
    })

    it('should handle minimal response object', () => {
      const res = { statusCode: 404 }
      const result = defaultSerializers.response?.(res)

      expect(result).toMatchObject({ statusCode: 404 })
    })

    it('should handle non-object input', () => {
      expect(defaultSerializers.response?.(null)).toEqual({})
      expect(defaultSerializers.response?.(undefined)).toEqual({})
      expect(defaultSerializers.response?.(123)).toEqual({})
    })
  })
})
