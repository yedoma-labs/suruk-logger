/**
 * Basic logging examples
 */

import { createLogger } from '../src/index'

// Create a logger
const logger = createLogger({
  name: 'basic-example',
  level: 'debug',
  pretty: true,
})

// Simple message
logger.info('Application started')

// Message with fields
logger.info('User action', { userId: 'user-123', action: 'login' })

// Fields-first syntax (Pino style)
logger.info({ userId: 'user-456', action: 'logout' }, 'User logged out')

// Different log levels
logger.debug('Debug information', { debug: true })
logger.warn('Warning: Rate limit approaching', { current: 95, max: 100 })
logger.error('Error occurred', { code: 'ERR_DB_CONNECTION' })

// Error logging
try {
  throw new Error('Database connection failed')
} catch (err) {
  logger.error(err as Error, 'Failed to connect to database')
}

// Child logger with inherited context
const serviceLogger = logger.child({ service: 'api' })
serviceLogger.info('Service started')

const requestLogger = serviceLogger.child({ requestId: 'req-789' })
requestLogger.info('Processing request')
