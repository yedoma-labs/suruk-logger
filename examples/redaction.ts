/**
 * Field redaction example
 */

import { createLogger } from '../src/index'

const logger = createLogger({
  name: 'redaction-example',
  pretty: true,
  // Redact sensitive fields
  redact: [
    'password',
    'token',
    'apiKey',
    'creditCard',
    'ssn',
    'headers.authorization',
    'headers.cookie',
  ],
})

// These fields will be automatically redacted
logger.info('User registration', {
  email: 'user@example.com',
  password: 'super-secret', // Will be redacted
  token: 'abc123', // Will be redacted
})

// Nested field redaction
logger.info('API request', {
  url: '/api/users',
  headers: {
    'content-type': 'application/json',
    authorization: 'Bearer secret-token', // Will be redacted
    'user-agent': 'Mozilla/5.0',
  },
  body: {
    apiKey: '12345', // Will be redacted
    data: 'some data',
  },
})

// Array redaction
logger.info('Payment processing', {
  orderId: 'order-123',
  items: [
    { name: 'Item 1', price: 10 },
    { name: 'Item 2', price: 20 },
  ],
  payment: {
    method: 'credit_card',
    creditCard: '4111-1111-1111-1111', // Will be redacted
  },
})
