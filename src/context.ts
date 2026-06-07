import { AsyncLocalStorage } from 'node:async_hooks'
import type { Logger, LogContext } from './types'

const asyncLocalStorage = new AsyncLocalStorage<LogContext>()

const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype']

function isDangerousKey(key: string): boolean {
  return DANGEROUS_KEYS.includes(key)
}

function safeAssign(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(source)) {
    if (isDangerousKey(key)) {
      continue
    }
    target[key] = value
  }
}

export function runWithContext<T>(context: LogContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn)
}

export function getContext(): LogContext | undefined {
  return asyncLocalStorage.getStore()
}

export function setContextValue(key: string, value: unknown): void {
  if (isDangerousKey(key)) {
    throw new Error(
      `Cannot set context key "${key}": key name is reserved and could pollute the prototype chain`
    )
  }

  const store = asyncLocalStorage.getStore()
  if (!store) {
    throw new Error('setContextValue must be called inside runWithContext')
  }

  store[key] = value
}

export function bindRequestContext(requestId: string, additionalFields?: LogContext): void {
  const store = asyncLocalStorage.getStore()
  if (!store) {
    throw new Error('bindRequestContext must be called inside runWithContext')
  }

  if (isDangerousKey('requestId')) {
    throw new Error('Invalid requestId field name')
  }

  store.requestId = requestId

  if (additionalFields) {
    safeAssign(store, additionalFields)
  }
}

let _requestLogger: Logger | undefined

export function setRequestLogger(logger: Logger): void {
  _requestLogger = logger
}

export function getRequestLogger(): Logger {
  if (!_requestLogger) {
    throw new Error(
      'Request logger not initialized. Ensure setRequestLogger(logger) is called during application startup.'
    )
  }

  const context = getContext()
  if (!context || Object.keys(context).length === 0) {
    return _requestLogger
  }

  return _requestLogger.child(context)
}
