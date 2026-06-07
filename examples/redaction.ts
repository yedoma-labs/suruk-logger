/**
 * Field redaction example
 * 
 * Demonstrates different redaction strategies:
 * 1. Top-level field redaction (e.g., 'password')
 * 2. Exact nested paths (e.g., 'headers.authorization')
 * 3. Wildcard patterns for any nesting level (e.g., '*.password')
 */

import { createLogger } from '../src/index'

const logger = createLogger({
  name: 'redaction-example',
  pretty: true,
  // Redact sensitive fields
  redact: [
    // Top-level fields only
    'password',      // Redacts { password: 'secret' }
    'token',         // Redacts { token: 'abc123' }
    'apiKey',        // Redacts { apiKey: 'key' }
    'creditCard',    // Redacts { creditCard: '4111...' }
    'ssn',           // Redacts { ssn: '123-45-6789' }
    
    // Exact nested paths
    'headers.authorization',  // Redacts { headers: { authorization: '...' } }
    'headers.cookie',         // Redacts { headers: { cookie: '...' } }
    
    // Wildcard patterns (for any object at any nesting level)
    '*.password',      // Redacts { user: { password: '...' } }
    '*.*.password',    // Redacts { data: { user: { password: '...' } } }
    '*.apiKey',        // Redacts { config: { apiKey: '...' } }
    '*.*.apiKey',      // Redacts deeper nesting
    '*.creditCard',    // Redacts { payment: { creditCard: '...' } }
    '*.*.creditCard',  // Redacts deeper nesting
  ],
})

console.log('\n=== Redaction Examples ===\n')

// Example 1: Top-level field redaction
console.log('Example 1: Top-level fields')
logger.info('User registration (top-level)', {
  email: 'user@example.com',
  password: 'super-secret', // ✅ Redacted (top-level 'password')
  token: 'abc123',          // ✅ Redacted (top-level 'token')
})

// Example 2: Exact path redaction
console.log('\nExample 2: Exact nested paths')
logger.info('API request (exact paths)', {
  url: '/api/users',
  headers: {
    'content-type': 'application/json',
    authorization: 'Bearer secret-token', // ✅ Redacted (exact path 'headers.authorization')
    'user-agent': 'Mozilla/5.0',
  },
  body: {
    apiKey: '12345', // ⚠️  NOT redacted (no exact path 'body.apiKey')
    data: 'some data',
  },
})

// Example 3: Wildcard pattern redaction (nested objects)
console.log('\nExample 3: Wildcard patterns (1 level deep)')
logger.info('User data (wildcards)', {
  publicInfo: {
    name: 'John Doe',
    email: 'john@example.com',
  },
  credentials: {
    password: 'my-secret-password',    // ✅ Redacted (wildcard '*.password')
    apiKey: 'sk_live_abc123',          // ✅ Redacted (wildcard '*.apiKey')
  },
})

// Example 4: Deep nesting with wildcards
console.log('\nExample 4: Wildcard patterns (2 levels deep)')
logger.info('Deep nested data (wildcards)', {
  application: {
    user: {
      name: 'Jane Smith',
      password: 'deep-secret',  // ✅ Redacted (wildcard '*.*.password')
      email: 'jane@example.com',
    },
    config: {
      apiKey: 'config-key-xyz',  // ✅ Redacted (wildcard '*.*.apiKey')
      timeout: 5000,
    },
  },
})

// Example 5: Payment processing
console.log('\nExample 5: Payment with wildcards')
logger.info('Payment processing', {
  orderId: 'order-123',
  items: [
    { name: 'Item 1', price: 10 },
    { name: 'Item 2', price: 20 },
  ],
  payment: {
    method: 'credit_card',
    creditCard: '4111-1111-1111-1111', // ✅ Redacted (wildcard '*.creditCard')
    amount: 100,
  },
})

// Example 6: Mixed top-level and nested
console.log('\nExample 6: Mixed top-level and nested')
logger.info('Mixed sensitive data', {
  // Top-level (redacted by 'password')
  password: 'top-level-secret',
  
  // Nested (redacted by '*.password')
  user: {
    name: 'Bob',
    password: 'nested-secret',
  },
  
  // NOT redacted (no wildcard for 'secret')
  config: {
    secret: 'this-is-not-redacted',
    timeout: 3000,
  },
})

console.log('\n=== Redaction Summary ===\n')
console.log('✅ Fields shown as [Redacted] are properly protected')
console.log('⚠️  Fields without matching redaction rules are visible')
console.log('\nRedaction Strategies:')
console.log('  1. Top-level: "password" → redacts { password: "..." }')
console.log('  2. Exact path: "headers.authorization" → redacts { headers: { authorization: "..." } }')
console.log('  3. Wildcard 1-level: "*.password" → redacts { obj: { password: "..." } }')
console.log('  4. Wildcard 2-level: "*.*.password" → redacts { obj: { sub: { password: "..." } } }')
console.log('')
