/**
 * Custom serializers example
 */

import { createLogger } from '../src/index'
import type { Serializers } from '../src/types'

// Custom serializers for specific use cases
const customSerializers: Serializers = {
  // Custom error serializer with additional context
  error: (err: Error) => {
    const serialized: Record<string, unknown> = {
      type: err.constructor.name,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    }

    // Add custom error properties
    if ('code' in err) {
      serialized.code = (err as { code: string }).code
    }
    if ('statusCode' in err) {
      serialized.statusCode = (err as { statusCode: number }).statusCode
    }

    return serialized
  },

  // Custom request serializer with redaction
  request: (req: unknown) => {
    if (!req || typeof req !== 'object') return {}

    const r = req as Record<string, unknown>
    const serialized: Record<string, unknown> = {}

    if ('id' in r) serialized.id = r.id
    if ('method' in r) serialized.method = r.method
    if ('url' in r) {
      // Redact query parameters that might contain sensitive data
      const url = String(r.url).split('?')[0]
      serialized.url = url
    }

    return serialized
  },

  // Custom response serializer
  response: (res: unknown) => {
    if (!res || typeof res !== 'object') return {}

    const r = res as Record<string, unknown>
    return {
      statusCode: r.statusCode,
      timestamp: new Date().toISOString(),
    }
  },
}

const logger = createLogger({
  name: 'custom-serializers',
  serializers: customSerializers,
  pretty: true,
})

// Test custom error serializer
class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

const dbError = new DatabaseError('Connection timeout', 'ERR_TIMEOUT', 500)
logger.error(dbError, 'Database operation failed')

// Test custom request serializer
const request = {
  id: 'req-123',
  method: 'GET',
  url: '/api/users?token=secret&api_key=12345',
  headers: { authorization: 'Bearer secret' },
}

logger.info({ req: request }, 'Request received')

// Test custom response serializer
const response = {
  statusCode: 200,
  headers: { 'content-type': 'application/json' },
}

logger.info({ res: response }, 'Response sent')
