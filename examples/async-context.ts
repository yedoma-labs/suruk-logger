/**
 * Async context isolation example
 */

import { createLogger, setRequestLogger, runWithContext, getRequestLogger } from '../src/index'

const baseLogger = createLogger({
  name: 'async-example',
  pretty: true,
})

setRequestLogger(baseLogger)

// Simulate request processing
async function processRequest(requestId: string, userId: string) {
  return runWithContext({ requestId, userId }, async () => {
    const logger = getRequestLogger()

    logger.info('Request started')

    // Simulate database query
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100))
    logger.info('Database query completed')

    // Simulate external API call
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100))
    logger.info('External API call completed')

    logger.info('Request finished')
    return { requestId, status: 'success' }
  })
}

// Process multiple requests in parallel
async function main() {
  console.log('Processing multiple requests in parallel...\n')

  const requests = [
    processRequest('req-1', 'user-100'),
    processRequest('req-2', 'user-200'),
    processRequest('req-3', 'user-300'),
  ]

  const results = await Promise.all(requests)

  console.log('\nAll requests completed:', results)
}

main().catch(console.error)
