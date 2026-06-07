import type { Logger as PinoLogger, LoggerOptions } from 'pino'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export type LogContext = Record<string, unknown>

export interface Serializers {
  error?: (err: Error) => Record<string, unknown>
  request?: (req: unknown) => Record<string, unknown>
  response?: (res: unknown) => Record<string, unknown>
}

export interface LoggerConfig {
  name: string
  level?: LogLevel
  pretty?: boolean
  serializers?: Serializers
  redact?: string[]
  base?: Record<string, unknown>
}

export interface Logger {
  debug(msg: string, fields?: LogContext): void
  debug(fields: LogContext, msg: string): void
  info(msg: string, fields?: LogContext): void
  info(fields: LogContext, msg: string): void
  warn(msg: string, fields?: LogContext): void
  warn(fields: LogContext, msg: string): void
  error(msg: string, fields?: LogContext): void
  error(fields: LogContext, msg: string): void
  error(err: Error, msg?: string): void
  fatal(msg: string, fields?: LogContext): void
  fatal(fields: LogContext, msg: string): void
  fatal(err: Error, msg?: string): void
  child(fields: LogContext): Logger
  readonly level: LogLevel
  readonly pino: PinoLogger
}

/**
 * Note: All serializer functions are required in the default implementation.
 * When providing custom serializers, they fully replace the default serializers.
 * Ensure custom serializers handle security concerns (redaction, depth limits, etc.).
 */

export type { LoggerOptions, PinoLogger }
