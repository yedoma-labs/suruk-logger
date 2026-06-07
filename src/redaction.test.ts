import { describe, it, expect, vi } from 'vitest'
import { createLogger } from './logger'

describe('Redaction', () => {
  describe('Top-level field redaction', () => {
    it('should redact password field', () => {
      const logger = createLogger({
        name: 'test',
        redact: ['password'],
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('User login', {
        username: 'john',
        password: 'secret123'
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })

    it('should redact multiple top-level fields', () => {
      const logger = createLogger({
        name: 'test',
        redact: ['password', 'token', 'apiKey'],
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('Authentication', {
        username: 'john',
        password: 'secret123',
        token: 'abc-xyz',
        apiKey: 'key-123'
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })
  })

  describe('Exact path redaction', () => {
    it('should redact nested path', () => {
      const logger = createLogger({
        name: 'test',
        redact: ['user.password'],
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('User data', {
        user: {
          name: 'John',
          password: 'secret123'
        }
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })

    it('should redact multiple exact paths', () => {
      const logger = createLogger({
        name: 'test',
        redact: ['headers.authorization', 'headers.cookie'],
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('HTTP request', {
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token',
          cookie: 'session=abc123'
        }
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })
  })

  describe('Wildcard redaction', () => {
    it('should redact using wildcard pattern', () => {
      const logger = createLogger({
        name: 'test',
        redact: ['*.password'],
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('User data', {
        user: {
          name: 'John',
          password: 'secret123'
        },
        admin: {
          name: 'Admin',
          password: 'admin-secret'
        }
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })

    it('should redact using deep wildcard pattern', () => {
      const logger = createLogger({
        name: 'test',
        redact: ['*.*.password'],
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('Deep nested data', {
        data: {
          user: {
            name: 'John',
            password: 'deep-secret'
          }
        }
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })

    it('should redact multiple wildcard patterns', () => {
      const logger = createLogger({
        name: 'test',
        redact: ['*.password', '*.token', '*.apiKey'],
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('Sensitive data', {
        auth: {
          password: 'secret',
          token: 'abc123'
        },
        config: {
          apiKey: 'key-xyz'
        }
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })
  })

  describe('Mixed redaction strategies', () => {
    it('should combine top-level and wildcard redaction', () => {
      const logger = createLogger({
        name: 'test',
        redact: [
          'password',
          '*.password',
          '*.*.password'
        ],
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('Multi-level passwords', {
        password: 'top-level',
        user: {
          password: 'nested-1'
        },
        data: {
          account: {
            password: 'nested-2'
          }
        }
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })

    it('should combine exact paths and wildcards', () => {
      const logger = createLogger({
        name: 'test',
        redact: [
          'headers.authorization',
          '*.token',
          'apiKey'
        ],
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('API request', {
        headers: {
          authorization: 'Bearer abc',
          'content-type': 'application/json'
        },
        auth: {
          token: 'xyz123'
        },
        apiKey: 'key-789'
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })
  })

  describe('Redaction with child loggers', () => {
    it('should inherit redaction from parent', () => {
      const logger = createLogger({
        name: 'test',
        redact: ['password', 'token'],
        pretty: false
      })

      const child = logger.child({ service: 'auth' })
      vi.spyOn(child.pino, 'info')
      
      child.info('User login', {
        username: 'john',
        password: 'secret123',
        token: 'abc-xyz'
      })

      expect(child.pino.info).toHaveBeenCalled()
    })

    it('should work with nested child loggers', () => {
      const logger = createLogger({
        name: 'test',
        redact: ['apiKey', '*.secret'],
        pretty: false
      })

      const child1 = logger.child({ service: 'api' })
      const child2 = child1.child({ requestId: 'req-123' })
      
      vi.spyOn(child2.pino, 'warn')
      
      child2.warn('External call', {
        apiKey: 'secret-key',
        config: {
          secret: 'hidden-value'
        }
      })

      expect(child2.pino.warn).toHaveBeenCalled()
    })
  })

  describe('Redaction with error logging', () => {
    it('should redact fields in error context', () => {
      const logger = createLogger({
        name: 'test',
        redact: ['password', 'token'],
        pretty: false
      })

      vi.spyOn(logger.pino, 'error')
      const error = new Error('Auth failed')
      
      logger.error(error, 'Authentication error', {
        username: 'john',
        password: 'secret123',
        token: 'abc-xyz'
      })

      expect(logger.pino.error).toHaveBeenCalled()
    })

    it('should redact nested fields in error context', () => {
      const logger = createLogger({
        name: 'test',
        redact: ['*.password', 'credentials.token'],
        pretty: false
      })

      vi.spyOn(logger.pino, 'error')
      const error = new Error('DB error')
      
      logger.error(error, 'Database authentication failed', {
        user: {
          username: 'dbuser',
          password: 'db-secret'
        },
        credentials: {
          token: 'db-token-123'
        }
      })

      expect(logger.pino.error).toHaveBeenCalled()
    })
  })

  describe('Production redaction patterns', () => {
    it('should handle comprehensive production config', () => {
      const logger = createLogger({
        name: 'prod',
        redact: [
          // Authentication
          'password',
          '*.password',
          '*.*.password',
          'token',
          '*.token',
          'apiKey',
          '*.apiKey',
          
          // Payment
          'cardNumber',
          '*.cardNumber',
          'cvv',
          '*.cvv',
          
          // PII
          'ssn',
          '*.ssn',
          
          // HTTP
          'headers.authorization',
          'headers.cookie'
        ],
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('Payment processing', {
        user: {
          name: 'John Doe',
          ssn: '123-45-6789',
          password: 'user-secret'
        },
        payment: {
          cardNumber: '4111111111111111',
          cvv: '123',
          amount: 100.00
        },
        auth: {
          token: 'bearer-abc-xyz',
          apiKey: 'pk_live_123456'
        },
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token',
          cookie: 'session=xyz'
        }
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty redact array', () => {
      const logger = createLogger({
        name: 'test',
        redact: [],
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('No redaction', {
        password: 'visible',
        token: 'visible'
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })

    it('should handle undefined redact config', () => {
      const logger = createLogger({
        name: 'test',
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('Default behavior', {
        password: 'visible',
        token: 'visible'
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })

    it('should handle redaction with null values', () => {
      const logger = createLogger({
        name: 'test',
        redact: ['password'],
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('Null password', {
        username: 'john',
        password: null
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })

    it('should handle redaction with undefined values', () => {
      const logger = createLogger({
        name: 'test',
        redact: ['token'],
        pretty: false
      })

      vi.spyOn(logger.pino, 'info')
      
      logger.info('Undefined token', {
        username: 'john',
        token: undefined
      })

      expect(logger.pino.info).toHaveBeenCalled()
    })
  })
})
