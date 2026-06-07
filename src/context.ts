import { AsyncLocalStorage } from 'node:async_hooks'
import type { Logger, LogContext } from './types'

const asyncLocalStorage = new AsyncLocalStorage<LogContext>()

export function runWithContext<T>(context: LogContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn)
}

export function getContext(): LogContext | undefined {
  return asyncLocalStorage.getStore()
}

export function setContextValue(key: string, value: unknown): void {
  const store = asyncLocalStorage.getStore()
  if (store) {
    store[key] = value
  }
}

export function bindRequestContext(requestId: string, additionalFields?: LogContext): void {
  const context: LogContext = { requestId, ...additionalFields }
  const store = asyncLocalStorage.getStore()
  if (store) {
    Object.assign(store, context)
  }
}

let _requestLogger: Logger | undefined

export function setRequestLogger(logger: Logger): void {
  _requestLogger = logger
}

export function getRequestLogger(): Logger {
  if (!_requestLogger) {
    throw new Error(
      'Request logger not initialized. Call setRequestLogger() first with your base logger.'
    )
  }

  const context = getContext()
  if (!context) {
    return _requestLogger
  }

  return _requestLogger.child(context)
}
