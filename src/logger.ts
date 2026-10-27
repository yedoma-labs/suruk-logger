import pino from 'pino'
import type { Logger, LoggerConfig, LogContext, LogLevel, PinoLogger } from './types'
import { defaultSerializers } from './serializers'
import { createDevTransport } from './dev-transport'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isError(value: unknown): value is Error {
  return value instanceof Error
}

function isSerializable(value: unknown): boolean {
  try {
    JSON.stringify(value)
    return true
  } catch {
    return false
  }
}

/**
 * Sanitize fields to prevent prototype pollution
 * Removes dangerous keys: __proto__, constructor, prototype
 */
function sanitizeFields(fields: LogContext): LogContext {
  if (!fields || typeof fields !== 'object') {
    return {}
  }

  const sanitized: LogContext = {}
  for (const [key, value] of Object.entries(fields)) {
    // Skip dangerous prototype pollution keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue
    }
    sanitized[key] = value
  }
  return sanitized
}

class SurukLogger implements Logger {
  private _pino: PinoLogger

  constructor(config: LoggerConfig) {
    const isDev = config.pretty ?? process.env.NODE_ENV !== 'production'
    const serializers = { ...defaultSerializers, ...config.serializers }

    this._pino = pino({
      name: config.name,
      level: config.level ?? (isDev ? 'debug' : 'info'),
      serializers,
      redact: config.redact,
      base: config.base ?? { pid: process.pid },
      transport: isDev ? createDevTransport() : undefined,
    })
  }

  get level(): LogLevel {
    return this._pino.level as LogLevel
  }

  get pino(): PinoLogger {
    return this._pino
  }

  /**
   * Whether a message at `level` would be emitted. Use it to skip building expensive payloads.
   */
  isLevelEnabled(level: LogLevel): boolean {
    return this._pino.isLevelEnabled(level)
  }

  debug(msgOrFields: string | LogContext, fieldsOrMsg?: LogContext | string): void {
    this._log('debug', msgOrFields, fieldsOrMsg)
  }

  info(msgOrFields: string | LogContext, fieldsOrMsg?: LogContext | string): void {
    this._log('info', msgOrFields, fieldsOrMsg)
  }

  warn(msgOrFields: string | LogContext, fieldsOrMsg?: LogContext | string): void {
    this._log('warn', msgOrFields, fieldsOrMsg)
  }

  /**
   * Log an error message
   *
   * @param msgOrFieldsOrErr - Error object, message string, or fields object
   * @param fieldsOrMsg - Additional fields or message
   * @param additionalFields - Additional context fields (avoid logging sensitive data here)
   *
   * @example
   * // Error with message
   * logger.error(new Error('Failed'), 'Database error')
   *
   * // Error with message and context
   * logger.error(new Error('Failed'), 'Database error', { query, duration })
   *
   * @security Do not log sensitive data (passwords, tokens, etc.) in additionalFields
   *           Configure redaction patterns instead
   */
  error(
    msgOrFieldsOrErr: string | LogContext | Error,
    fieldsOrMsg?: LogContext | string,
    additionalFields?: LogContext
  ): void {
    if (isError(msgOrFieldsOrErr)) {
      const msg = typeof fieldsOrMsg === 'string' ? fieldsOrMsg : msgOrFieldsOrErr.message
      const fields = additionalFields ? sanitizeFields(additionalFields) : {}
      this._pino.error({ err: msgOrFieldsOrErr, ...fields }, msg)
      return
    }

    this._log('error', msgOrFieldsOrErr, fieldsOrMsg)
  }

  /**
   * Log a fatal error message
   *
   * @param msgOrFieldsOrErr - Error object, message string, or fields object
   * @param fieldsOrMsg - Additional fields or message
   * @param additionalFields - Additional context fields (avoid logging sensitive data here)
   *
   * @example
   * // Fatal error with message
   * logger.fatal(new Error('Out of memory'), 'System failure')
   *
   * // Fatal error with message and context
   * logger.fatal(new Error('Out of memory'), 'System failure', { heapUsed, uptime })
   *
   * @security Do not log sensitive data (passwords, tokens, etc.) in additionalFields
   *           Configure redaction patterns instead
   */
  fatal(
    msgOrFieldsOrErr: string | LogContext | Error,
    fieldsOrMsg?: LogContext | string,
    additionalFields?: LogContext
  ): void {
    if (isError(msgOrFieldsOrErr)) {
      const msg = typeof fieldsOrMsg === 'string' ? fieldsOrMsg : msgOrFieldsOrErr.message
      const fields = additionalFields ? sanitizeFields(additionalFields) : {}
      this._pino.fatal({ err: msgOrFieldsOrErr, ...fields }, msg)
      return
    }

    this._log('fatal', msgOrFieldsOrErr, fieldsOrMsg)
  }

  child(fields: LogContext): Logger {
    const childPino = this._pino.child(fields)
    const childLogger = Object.create(SurukLogger.prototype)
    childLogger._pino = childPino
    return childLogger as Logger
  }

  private _log(
    level: LogLevel,
    msgOrFields: string | LogContext,
    fieldsOrMsg?: LogContext | string
  ): void {
    if (typeof msgOrFields === 'string') {
      // log(msg) or log(msg, fields)
      const msg = msgOrFields
      const fields = isObject(fieldsOrMsg) ? fieldsOrMsg : undefined
      this._pino[level](fields ?? {}, msg)
    } else if (isObject(msgOrFields)) {
      // log(fields, msg)
      const fields = msgOrFields
      if (typeof fieldsOrMsg === 'string') {
        this._pino[level](fields, fieldsOrMsg)
        return
      }
      // No message given: log the fields alone. The message is never derived from the fields,
      // because JSON.stringify would copy values past pino's redact paths into the output.
      if (isSerializable(fields)) {
        this._pino[level](fields)
      } else {
        // Circular references cannot be serialized
        this._pino[level](fields, '[Object with circular reference]')
      }
    } else {
      // Unsupported signature
      this._pino[level]({}, String(msgOrFields))
    }
  }
}

export function createLogger(config: LoggerConfig): Logger {
  return new SurukLogger(config)
}
