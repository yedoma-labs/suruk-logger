import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLogger } from './logger'
import type { Logger } from './types'

describe('SurukLogger', () => {
  let logger: Logger

  beforeEach(() => {
    logger = createLogger({ name: 'test', level: 'debug', pretty: false })
  })

  describe('Winston-compatible API', () => {
    it('should create a logger with all log methods', () => {
      expect(logger.debug).toBeDefined()
      expect(logger.info).toBeDefined()
      expect(logger.warn).toBeDefined()
      expect(logger.error).toBeDefined()
      expect(logger.fatal).toBeDefined()
      expect(logger.child).toBeDefined()
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
    })

    it('should have a level property', () => {
      expect(logger.level).toBe('debug')
    })

    it('should expose underlying pino instance', () => {
      expect(logger.pino).toBeDefined()
      expect(typeof logger.pino.info).toBe('function')
    })
  })

  describe('Logging methods', () => {
    beforeEach(() => {
      vi.spyOn(logger.pino, 'info')
      vi.spyOn(logger.pino, 'error')
      vi.spyOn(logger.pino, 'warn')
      vi.spyOn(logger.pino, 'debug')
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should log message only', () => {
      logger.info('test message')
      expect(logger.pino.info).toHaveBeenCalledWith({}, 'test message')
    })

    it('should log message with fields (msg, fields)', () => {
      logger.info('test message', { userId: 123 })
      expect(logger.pino.info).toHaveBeenCalledWith({ userId: 123 }, 'test message')
    })

    it('should log fields with message (fields, msg)', () => {
      logger.info({ userId: 123 }, 'test message')
      expect(logger.pino.info).toHaveBeenCalledWith({ userId: 123 }, 'test message')
    })

    it('should handle all log levels', () => {
      logger.debug('debug msg')
      logger.info('info msg')
      logger.warn('warn msg')
      logger.error('error msg')

      expect(logger.pino.debug).toHaveBeenCalledWith({}, 'debug msg')
      expect(logger.pino.info).toHaveBeenCalledWith({}, 'info msg')
      expect(logger.pino.warn).toHaveBeenCalledWith({}, 'warn msg')
      expect(logger.pino.error).toHaveBeenCalledWith({}, 'error msg')
    })
  })

  describe('Error logging', () => {
    it('should log errors with stack traces', () => {
      vi.spyOn(logger.pino, 'error')
      const error = new Error('test error')
      logger.error(error)

      expect(logger.pino.error).toHaveBeenCalledWith({ err: error }, 'test error')
    })

    it('should log errors with custom message', () => {
      vi.spyOn(logger.pino, 'error')
      const error = new Error('test error')
      logger.error(error, 'Custom error message')

      expect(logger.pino.error).toHaveBeenCalledWith({ err: error }, 'Custom error message')
    })

    it('should log fatal errors', () => {
      vi.spyOn(logger.pino, 'fatal')
      const error = new Error('fatal error')
      logger.fatal(error, 'Critical failure')

      expect(logger.pino.fatal).toHaveBeenCalledWith({ err: error }, 'Critical failure')
    })

    it('should log fatal errors without custom message', () => {
      vi.spyOn(logger.pino, 'fatal')
      const error = new Error('fatal error message')
      logger.fatal(error)

      expect(logger.pino.fatal).toHaveBeenCalledWith({ err: error }, 'fatal error message')
    })

    it('should handle fatal error with fields parameter (non-string)', () => {
      vi.spyOn(logger.pino, 'fatal')
      const error = new Error('fatal')
      
      // Pass error with fields object (should use error message)
      logger.fatal(error, { context: 'test' } as never)

      expect(logger.pino.fatal).toHaveBeenCalledWith({ err: error }, 'fatal')
    })

    it('should log error with custom message and additional fields', () => {
      vi.spyOn(logger.pino, 'error')
      const error = new Error('Query failed')
      
      logger.error(error, 'Database error', {
        query: 'SELECT * FROM users',
        duration: 1234,
        retries: 3
      })

      expect(logger.pino.error).toHaveBeenCalledWith(
        {
          err: error,
          query: 'SELECT * FROM users',
          duration: 1234,
          retries: 3
        },
        'Database error'
      )
    })

    it('should log fatal error with custom message and additional fields', () => {
      vi.spyOn(logger.pino, 'fatal')
      const error = new Error('Critical failure')
      
      logger.fatal(error, 'System shutdown', {
        reason: 'out_of_memory',
        uptime: 3600,
        lastCheckpoint: '2024-01-01T00:00:00Z'
      })

      expect(logger.pino.fatal).toHaveBeenCalledWith(
        {
          err: error,
          reason: 'out_of_memory',
          uptime: 3600,
          lastCheckpoint: '2024-01-01T00:00:00Z'
        },
        'System shutdown'
      )
    })

    it('should handle error with empty additional fields', () => {
      vi.spyOn(logger.pino, 'error')
      const error = new Error('Test error')
      
      logger.error(error, 'Error message', {})

      expect(logger.pino.error).toHaveBeenCalledWith(
        { err: error },
        'Error message'
      )
    })

    it('should sanitize __proto__ from additional fields', () => {
      vi.spyOn(logger.pino, 'error')
      const error = new Error('Test error')
      
      logger.error(error, 'Error message', {
        __proto__: { polluted: true },
        validField: 'value'
      } as never)

      expect(logger.pino.error).toHaveBeenCalledWith(
        {
          err: error,
          validField: 'value'
          // __proto__ should be filtered out
        },
        'Error message'
      )
    })

    it('should sanitize constructor from additional fields', () => {
      vi.spyOn(logger.pino, 'error')
      const error = new Error('Test error')
      
      logger.error(error, 'Error message', {
        constructor: { prototype: { polluted: true } },
        validField: 'value'
      } as never)

      expect(logger.pino.error).toHaveBeenCalledWith(
        {
          err: error,
          validField: 'value'
          // constructor should be filtered out
        },
        'Error message'
      )
    })

    it('should sanitize prototype from additional fields', () => {
      vi.spyOn(logger.pino, 'fatal')
      const error = new Error('Fatal error')
      
      logger.fatal(error, 'Fatal message', {
        prototype: { polluted: true },
        validField: 'value'
      } as never)

      expect(logger.pino.fatal).toHaveBeenCalledWith(
        {
          err: error,
          validField: 'value'
          // prototype should be filtered out
        },
        'Fatal message'
      )
    })
  })

  describe('Child logger', () => {
    it('should create child logger with inherited context', () => {
      const child = logger.child({ requestId: 'req-123' })

      expect(child).toBeDefined()
      expect(child.info).toBeDefined()
      expect(child.pino.bindings()).toMatchObject({ requestId: 'req-123' })
    })

    it('should allow chaining child loggers', () => {
      const child1 = logger.child({ service: 'api' })
      const child2 = child1.child({ requestId: 'req-123' })

      expect(child2.pino.bindings()).toMatchObject({
        service: 'api',
        requestId: 'req-123',
      })
    })
  })

  describe('Circular references', () => {
    it('should handle circular references without crashing', () => {
      vi.spyOn(logger.pino, 'info')

      const circular: Record<string, unknown> = { name: 'test' }
      circular.self = circular

      // Should not throw (using fields-first signature)
      expect(() => {
        logger.info(circular, 'Circular object')
      }).not.toThrow()

      expect(logger.pino.info).toHaveBeenCalled()
    })

    it('should use fallback message for circular references in fields-only call', () => {
      vi.spyOn(logger.pino, 'warn')

      const circular: Record<string, unknown> = { data: 'value' }
      circular.ref = circular

      // Call with fields and non-string second param - should trigger JSON.stringify fallback
      logger.warn(circular, {} as never)

      expect(logger.pino.warn).toHaveBeenCalledWith(
        circular,
        '[Object with circular reference]'
      )
    })
  })

  describe('Edge cases', () => {
    it('should handle non-string, non-object values', () => {
      vi.spyOn(logger.pino, 'warn')

      // Test with number (falls through to String() conversion)
      logger.warn(123 as never)

      expect(logger.pino.warn).toHaveBeenCalledWith({}, '123')
    })

    it('should handle null values', () => {
      vi.spyOn(logger.pino, 'info')

      logger.info(null as never)

      expect(logger.pino.info).toHaveBeenCalledWith({}, 'null')
    })

    it('should handle undefined values', () => {
      vi.spyOn(logger.pino, 'debug')

      logger.debug(undefined as never)

      expect(logger.pino.debug).toHaveBeenCalledWith({}, 'undefined')
    })
  })

  describe('Configuration', () => {
    it('should respect log level', () => {
      const prodLogger = createLogger({ name: 'prod', level: 'warn', pretty: false })
      expect(prodLogger.level).toBe('warn')
    })

    it('should default to info level in production', () => {
      const original = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const prodLogger = createLogger({ name: 'prod' })
      expect(prodLogger.level).toBe('info')

      process.env.NODE_ENV = original
    })

    it('should default to debug level in development', () => {
      const original = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const devLogger = createLogger({ name: 'dev' })
      expect(devLogger.level).toBe('debug')

      process.env.NODE_ENV = original
    })

    it('should apply custom base fields', () => {
      const customLogger = createLogger({
        name: 'custom',
        base: { service: 'my-service', version: '1.0.0' },
        pretty: false,
      })

      expect(customLogger.pino.bindings()).toMatchObject({
        service: 'my-service',
        version: '1.0.0',
      })
    })
  })
})
