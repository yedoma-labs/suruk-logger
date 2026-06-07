/**
 * Error logging with additional context fields
 * 
 * Demonstrates the enhanced error logging API that allows
 * passing both an error object and additional context fields
 * in a single call.
 */

import { createLogger } from '../src/index'

const logger = createLogger({
  name: 'error-context-example',
  pretty: true,
})

console.log('\n=== Error Logging with Context ===\n')

// Example 1: Basic error logging (existing functionality)
console.log('Example 1: Basic error logging')
try {
  throw new Error('Connection timeout')
} catch (error) {
  logger.error(error as Error, 'Database connection failed')
}

// Example 2: Error with additional context fields (NEW!)
console.log('\nExample 2: Error with context fields')
try {
  throw new Error('Query execution failed')
} catch (error) {
  logger.error(error as Error, 'Database query error', {
    query: 'SELECT * FROM users WHERE id = ?',
    params: ['user_123'],
    duration: 5234,
    retries: 3,
    database: 'production',
  })
}

// Example 3: Fatal error with context
console.log('\nExample 3: Fatal error with context')
try {
  throw new Error('Out of memory')
} catch (error) {
  logger.fatal(error as Error, 'Critical system failure', {
    reason: 'heap_limit_exceeded',
    heapUsed: '2GB',
    heapLimit: '2GB',
    uptime: 86400,
    lastGC: Date.now() - 1000,
  })
}

// Example 4: API error with request context
console.log('\nExample 4: API error with request context')
async function callExternalAPI() {
  const apiUrl = 'https://api.example.com/users'
  const startTime = Date.now()
  
  try {
    // Simulate API call
    throw new Error('Network timeout')
  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error(error as Error, 'External API call failed', {
      api: 'user-service',
      endpoint: apiUrl,
      method: 'GET',
      statusCode: undefined, // No response received
      duration,
      retries: 2,
      timeout: 5000,
      requestId: 'req_abc123',
    })
  }
}

await callExternalAPI()

// Example 5: Database transaction error
console.log('\nExample 5: Database transaction error')
try {
  throw new Error('Deadlock detected')
} catch (error) {
  logger.error(error as Error, 'Transaction failed', {
    operation: 'UPDATE users SET balance = balance - ?',
    transactionId: 'txn_xyz789',
    isolationLevel: 'READ_COMMITTED',
    affectedRows: 0,
    lockWaitTime: 30000,
  })
}

// Example 6: File system error with path information
console.log('\nExample 6: File system error')
try {
  throw new Error('ENOENT: no such file or directory')
} catch (error) {
  logger.error(error as Error, 'File operation failed', {
    operation: 'read',
    path: '/var/log/application.log',
    permissions: '0644',
    owner: 'node',
    size: undefined,
  })
}

console.log('\n=== Benefits ===\n')
console.log('✅ Cleaner API - no need to wrap error in fields object')
console.log('✅ Better type safety - error is properly typed')
console.log('✅ Consistent logging - error + message + context in one call')
console.log('✅ Easier debugging - all context attached to error log')
console.log('')
