import { describe, it, expect, beforeEach } from 'vitest'
import {
  runWithContext,
  getContext,
  setContextValue,
  bindRequestContext,
  setRequestLogger,
  getRequestLogger,
} from './context'
import { createLogger } from './logger'
import type { Logger } from './types'

describe('Context management', () => {
  let baseLogger: Logger

  beforeEach(() => {
    baseLogger = createLogger({ name: 'test', pretty: false })
    setRequestLogger(baseLogger)
  })

  describe('runWithContext', () => {
    it('should run function with context', () => {
      const result = runWithContext({ requestId: 'req-123' }, () => {
        const context = getContext()
        return context?.requestId
      })

      expect(result).toBe('req-123')
    })

    it('should isolate contexts between calls', () => {
      const result1 = runWithContext({ requestId: 'req-1' }, () => getContext()?.requestId)

      const result2 = runWithContext({ requestId: 'req-2' }, () => getContext()?.requestId)

      expect(result1).toBe('req-1')
      expect(result2).toBe('req-2')
    })

    it('should return undefined when no context', () => {
      const context = getContext()
      expect(context).toBeUndefined()
    })
  })

  describe('setContextValue', () => {
    it('should add value to existing context', () => {
      runWithContext({ requestId: 'req-123' }, () => {
        setContextValue('userId', 'user-456')

        const context = getContext()
        expect(context).toMatchObject({
          requestId: 'req-123',
          userId: 'user-456',
        })
      })
    })

    it('should throw when no context exists', () => {
      expect(() => {
        setContextValue('key', 'value')
      }).toThrow('setContextValue must be called inside runWithContext')
    })

    it('should reject dangerous keys', () => {
      runWithContext({ requestId: 'req-123' }, () => {
        expect(() => {
          setContextValue('__proto__', 'malicious')
        }).toThrow('prototype chain')
      })
    })
  })

  describe('bindRequestContext', () => {
    it('should bind request ID to context', () => {
      runWithContext({}, () => {
        bindRequestContext('req-789')

        const context = getContext()
        expect(context?.requestId).toBe('req-789')
      })
    })

    it('should bind request ID with additional fields', () => {
      runWithContext({}, () => {
        bindRequestContext('req-789', { userId: 'user-123', ip: '127.0.0.1' })

        const context = getContext()
        expect(context).toMatchObject({
          requestId: 'req-789',
          userId: 'user-123',
          ip: '127.0.0.1',
        })
      })
    })
  })

  describe('Request logger', () => {
    it('should get request logger with context', () => {
      runWithContext({ requestId: 'req-123' }, () => {
        const reqLogger = getRequestLogger()

        expect(reqLogger).toBeDefined()
        expect(reqLogger.pino.bindings()).toMatchObject({ requestId: 'req-123' })
      })
    })

    it('should return base logger when no context', () => {
      const reqLogger = getRequestLogger()

      expect(reqLogger).toBe(baseLogger)
    })
  })

  describe('Security', () => {
    it('should prevent prototype pollution via bindRequestContext', () => {
      runWithContext({}, () => {
        // Attempt prototype pollution
        bindRequestContext('req-123', { __proto__: { polluted: true } } as never)

        // Verify pollution didn't occur
        const testObj = {}
        expect((testObj as { polluted?: boolean }).polluted).toBeUndefined()
      })
    })

    it('should filter dangerous keys from additionalFields', () => {
      runWithContext({}, () => {
        // Attempt to set multiple dangerous keys
        bindRequestContext('req-456', {
          __proto__: 'evil',
          constructor: 'bad',
          prototype: 'malicious',
          normalKey: 'good',
        } as never)

        const context = getContext()
        expect(context?.normalKey).toBe('good')
        // Check that dangerous keys are not in own properties
        expect(Object.prototype.hasOwnProperty.call(context, '__proto__')).toBe(false)
        expect(Object.prototype.hasOwnProperty.call(context, 'constructor')).toBe(false)
        expect(Object.prototype.hasOwnProperty.call(context, 'prototype')).toBe(false)
      })
    })

    it('should throw when bindRequestContext called outside context', () => {
      expect(() => {
        bindRequestContext('req-123')
      }).toThrow('bindRequestContext must be called inside runWithContext')
    })
  })

  describe('Edge cases', () => {
    it('should return base logger for empty context', () => {
      runWithContext({}, () => {
        const logger = getRequestLogger()
        // Empty context should return base logger
        expect(logger).toBe(baseLogger)
      })
    })

    it('should create child logger when context has values', () => {
      runWithContext({ requestId: 'req-789', userId: 'user-123' }, () => {
        const logger = getRequestLogger()
        // Should create child, not return base logger
        expect(logger).not.toBe(baseLogger)
        expect(logger.pino.bindings()).toMatchObject({
          requestId: 'req-789',
          userId: 'user-123',
        })
      })
    })
  })

  describe('Async context isolation', () => {
    it('should maintain context across async operations', async () => {
      const result = await runWithContext({ requestId: 'req-async' }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return getContext()?.requestId
      })

      expect(result).toBe('req-async')
    })

    it('should isolate contexts in parallel async operations', async () => {
      const promises = [
        runWithContext({ requestId: 'req-1' }, async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return getContext()?.requestId
        }),
        runWithContext({ requestId: 'req-2' }, async () => {
          await new Promise((resolve) => setTimeout(resolve, 5))
          return getContext()?.requestId
        }),
        runWithContext({ requestId: 'req-3' }, async () => {
          await new Promise((resolve) => setTimeout(resolve, 15))
          return getContext()?.requestId
        }),
      ]

      const results = await Promise.all(promises)

      expect(results).toEqual(['req-1', 'req-2', 'req-3'])
    })
  })
})
