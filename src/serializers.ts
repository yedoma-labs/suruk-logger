import type { Serializers } from './types'

export const defaultSerializers: Serializers = {
  error: (err: Error) => {
    const serialized: Record<string, unknown> = {
      type: err.constructor.name,
      message: err.message,
      stack: err.stack,
    }

    // Include any custom properties on the error object
    for (const key of Object.getOwnPropertyNames(err)) {
      if (!['message', 'stack', 'name'].includes(key)) {
        serialized[key] = (err as unknown as Record<string, unknown>)[key]
      }
    }

    // Include cause if present (Error.cause is standard in Node 16+)
    if ('cause' in err && err.cause) {
      const errorSerializer = defaultSerializers.error
      serialized.cause =
        err.cause instanceof Error && errorSerializer
          ? errorSerializer(err.cause)
          : err.cause
    }

    return serialized
  },

  request: (req: unknown) => {
    if (!req || typeof req !== 'object') return {}

    const r = req as Record<string, unknown>
    const serialized: Record<string, unknown> = {}

    if ('id' in r && r.id) serialized.id = r.id
    if ('method' in r && r.method) serialized.method = r.method
    if ('url' in r && r.url) serialized.url = r.url
    if ('headers' in r && r.headers) {
      const headers = r.headers as Record<string, unknown>
      serialized.headers = {
        host: headers.host,
        'user-agent': headers['user-agent'],
        'content-type': headers['content-type'],
        'content-length': headers['content-length'],
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
    if ('headers' in r && r.headers) {
      const headers = r.headers as Record<string, unknown>
      serialized.headers = {
        'content-type': headers['content-type'],
        'content-length': headers['content-length'],
      }
    }

    return serialized
  },
}
