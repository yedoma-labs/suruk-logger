/**
 * Express integration example with request context
 */

import express from 'express'
import { randomUUID } from 'node:crypto'
import {
  createLogger,
  setRequestLogger,
  runWithContext,
  getRequestLogger,
  bindRequestContext,
} from '../src/index'

const app = express()
const port = 3000

// Create base logger
const baseLogger = createLogger({
  name: 'express-api',
  level: 'info',
})

// Set as request logger
setRequestLogger(baseLogger)

// Request logging middleware
app.use((req, res, next) => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID()

  // Run request handler in context
  runWithContext({ requestId }, () => {
    bindRequestContext(requestId, {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
    })

    const logger = getRequestLogger()
    logger.info({ req }, 'Request started')

    const start = Date.now()

    res.on('finish', () => {
      const duration = Date.now() - start
      logger.info({ res, duration }, 'Request completed')
    })

    next()
  })
})

// Routes
app.get('/users/:id', (req, res) => {
  const logger = getRequestLogger()
  const userId = req.params.id

  logger.info({ userId }, 'Fetching user')

  // Simulate some processing
  setTimeout(() => {
    logger.info({ userId }, 'User found')
    res.json({ id: userId, name: 'John Doe' })
  }, 100)
})

app.post('/users', express.json(), (req, res) => {
  const logger = getRequestLogger()

  logger.info({ body: req.body }, 'Creating user')

  // Simulate error
  if (!req.body.email) {
    const error = new Error('Email is required')
    logger.error(error, 'Validation failed')
    res.status(400).json({ error: 'Email is required' })
    return
  }

  res.status(201).json({ id: randomUUID(), ...req.body })
})

app.listen(port, () => {
  baseLogger.info({ port }, 'Server listening')
})
