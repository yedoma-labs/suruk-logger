import type { Serializers } from './types'

const MAX_CAUSE_DEPTH = 10
const SAFE_ERROR_KEYS = [
  'code',
  'statusCode',
  'errno',
  'syscall',
  'path',
  'address',
  'port',
  'status',
]

function serializeErrorWithDepth(err: Error, depth = 0): Record<string, unknown> {
  if (depth >= MAX_CAUSE_DEPTH) {
    return {
      type: 'Error',
      message: '[cause chain truncated - max depth exceeded]',
    }
  }

  const serialized: Record<string, unknown> = {
    type: err.constructor.name,
    message: err.message,
    stack: err.stack,
  }

  // Only include known-safe custom properties to prevent sensitive data leakage
  for (const key of Object.getOwnPropertyNames(err)) {
    if (SAFE_ERROR_KEYS.includes(key)) {
      serialized[key] = (err as unknown as Record<string, unknown>)[key]
    }
  }

  // Include cause if present (Error.cause is standard in Node 16+)
  if ('cause' in err && err.cause) {
    if (err.cause instanceof Error) {
      serialized.cause = serializeErrorWithDepth(err.cause, depth + 1)
    } else {
      serialized.cause = String(err.cause)
    }
  }

  return serialized
}

export const defaultSerializers: Serializers = {
  error: (err: Error) => {
    return serializeErrorWithDepth(err, 0)
  },

  request: (req: unknown) => {
    if (!req || typeof req !== 'object') return {}

    const r = req as Record<string, unknown>
    const serialized: Record<string, unknown> = {}

    if ('id' in r && r.id) serialized.id = r.id
    if ('method' in r && r.method) serialized.method = r.method
    if ('url' in r && r.url) serialized.url = r.url
    if ('headers' in r && r.headers && typeof r.headers === 'object' && !Array.isArray(r.headers)) {
      const headers = r.headers as Record<string, unknown>
      // Normalize header keys to lowercase for consistent access
      const normalizedHeaders: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(headers)) {
        normalizedHeaders[key.toLowerCase()] = value
      }

      serialized.headers = {
        host: normalizedHeaders.host,
        'user-agent': normalizedHeaders['user-agent'],
        'content-type': normalizedHeaders['content-type'],
        'content-length': normalizedHeaders['content-length'],
      }
    }
    if ('remoteAddress' in r && r.remoteAddress) serialized.remoteAddress = r.remoteAddress
    if ('remotePort' in r && r.remotePort) serialized.remotePort = r.remotePort

    return serialized
  },

  response: (res: unknown) => {
    if (!res || typeof res !== 'object') return {}

    const r = res as Record<string, unknown>
    const serialized: Record<string, unknown> = {}

    if ('statusCode' in r && r.statusCode) serialized.statusCode = r.statusCode
    if ('headers' in r && r.headers && typeof r.headers === 'object' && !Array.isArray(r.headers)) {
      const headers = r.headers as Record<string, unknown>
      // Normalize header keys to lowercase for consistent access
      const normalizedHeaders: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(headers)) {
        normalizedHeaders[key.toLowerCase()] = value
      }

      serialized.headers = {
        'content-type': normalizedHeaders['content-type'],
        'content-length': normalizedHeaders['content-length'],
      }
    }

    return serialized
  },
}
