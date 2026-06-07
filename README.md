# @yedoma-labs/suruk-logger

**Winston-compatible Pino wrapper with request context binding**

*suruk* (сурук; Yakutian/Sakha) = "trace/mark"

[![CI](https://github.com/yedoma-labs/suruk-logger/workflows/CI/badge.svg)](https://github.com/yedoma-labs/suruk-logger/actions)
[![npm version](https://img.shields.io/npm/v/@yedoma-labs/suruk-logger.svg)](https://www.npmjs.com/package/@yedoma-labs/suruk-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why?

Winston is slowing down. Bunyan is abandoned. Pino is fast but has low adoption.

**suruk-logger** gives you:
- **Winston syntax** → Easy migration from Winston
- **Pino speed** → 5-10x faster logging
- **Request context** → Auto-attach request ID to all logs
- **TypeScript-first** → Full type inference, no `any`
- **Zero dependencies** → Pino as peer dependency only

## Installation

```bash
npm install @yedoma-labs/suruk-logger pino
# or
pnpm add @yedoma-labs/suruk-logger pino
# or
yarn add @yedoma-labs/suruk-logger pino
```

**Development pretty-printing** (optional):
```bash
npm install --save-dev pino-pretty
```

## Quick Start

### Basic Usage

```typescript
import { createLogger } from '@yedoma-labs/suruk-logger'

const logger = createLogger({ name: 'my-service' })

logger.info('Server started', { port: 3000 })
logger.error(new Error('Database connection failed'))
```

### Request Context Binding

Automatically attach request ID to all logs within a request:

```typescript
import { createLogger, setRequestLogger, runWithContext, getRequestLogger } from '@yedoma-labs/suruk-logger'

const baseLogger = createLogger({ name: 'api' })
setRequestLogger(baseLogger)

app.use((req, res, next) => {
  runWithContext({ requestId: req.id }, () => {
    const reqLogger = getRequestLogger()
    reqLogger.info('Request received', { method: req.method, url: req.url })
    next()
  })
})
```

### Child Loggers

Create scoped loggers that inherit parent context:

```typescript
const logger = createLogger({ name: 'app' })
const serviceLogger = logger.child({ service: 'auth' })
const userLogger = serviceLogger.child({ userId: 'user-123' })

userLogger.info('User logged in')
// Output: {"service":"auth","userId":"user-123","msg":"User logged in"}
```

## API

### `createLogger(config: LoggerConfig): Logger`

Create a new logger instance.

**Config options:**
- `name` (required): Logger name
- `level`: Log level (`'debug' | 'info' | 'warn' | 'error' | 'fatal'`)
  - Default: `'debug'` in development, `'info'` in production
- `pretty`: Enable pretty-printing
  - Default: `true` in development, `false` in production
- `serializers`: Custom serializers for error, request, response
- `redact`: Array of paths to redact (e.g., `['password', 'creditCard']`)
- `base`: Base fields to include in all logs

**Example:**
```typescript
const logger = createLogger({
  name: 'my-service',
  level: 'info',
  pretty: false,
  redact: ['password', 'token'],
  base: { version: '1.0.0', env: process.env.NODE_ENV }
})
```

### Logger Methods

Winston-compatible API with multiple signatures:

```typescript
// Message only
logger.info('User logged in')

// Message + fields
logger.info('User logged in', { userId: 'user-123' })

// Fields + message (Pino style)
logger.info({ userId: 'user-123' }, 'User logged in')

// Error logging
logger.error(new Error('Failed'), 'Database connection error')

// Available levels
logger.debug('Debug message')
logger.info('Info message')
logger.warn('Warning message')
logger.error('Error message')
logger.fatal('Fatal message')
```

### Context Management

#### `runWithContext<T>(context: LogContext, fn: () => T): T`

Run a function with async local storage context:

```typescript
runWithContext({ requestId: 'req-123' }, () => {
  const logger = getRequestLogger()
  logger.info('Processing request') // Includes requestId
})
```

#### `getContext(): LogContext | undefined`

Get current async local storage context:

```typescript
const context = getContext()
console.log(context?.requestId)
```

#### `setContextValue(key: string, value: unknown): void`

Add a value to the current context:

```typescript
runWithContext({}, () => {
  setContextValue('userId', 'user-456')
  const logger = getRequestLogger()
  logger.info('User action') // Includes userId
})
```

#### `bindRequestContext(requestId: string, additionalFields?: LogContext): void`

Bind request ID to current context:

```typescript
app.use((req, res, next) => {
  runWithContext({}, () => {
    bindRequestContext(req.id, { ip: req.ip })
    next()
  })
})
```

#### `setRequestLogger(logger: Logger): void`

Set the base logger for request context:

```typescript
const baseLogger = createLogger({ name: 'api' })
setRequestLogger(baseLogger)
```

#### `getRequestLogger(): Logger`

Get logger with current context applied:

```typescript
const logger = getRequestLogger()
logger.info('Request processing') // Includes all context fields
```

### Default Serializers

Built-in serializers for common types:

**Error serializer:**
```typescript
logger.error(new Error('Failed'))
// { "err": { "type": "Error", "message": "Failed", "stack": "..." } }
```

**Request serializer:**
```typescript
logger.info({ req: request }, 'Request received')
// { "req": { "id": "...", "method": "GET", "url": "/api/users", ... } }
```

**Response serializer:**
```typescript
logger.info({ res: response }, 'Response sent')
// { "res": { "statusCode": 200, "headers": { ... } } }
```

## Express/Fastify Integration

### Express

```typescript
import express from 'express'
import { createLogger, setRequestLogger, runWithContext, getRequestLogger } from '@yedoma-labs/suruk-logger'
import { randomUUID } from 'crypto'

const app = express()
const baseLogger = createLogger({ name: 'api' })
setRequestLogger(baseLogger)

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] as string || randomUUID()
  
  runWithContext({ requestId }, () => {
    const logger = getRequestLogger()
    logger.info({ req }, 'Request started')
    
    res.on('finish', () => {
      logger.info({ res }, 'Request completed')
    })
    
    next()
  })
})

app.get('/users/:id', (req, res) => {
  const logger = getRequestLogger()
  logger.info({ userId: req.params.id }, 'Fetching user')
  res.json({ id: req.params.id })
})
```

### Fastify

```typescript
import Fastify from 'fastify'
import { createLogger, setRequestLogger, runWithContext, getRequestLogger } from '@yedoma-labs/suruk-logger'

const fastify = Fastify()
const baseLogger = createLogger({ name: 'api' })
setRequestLogger(baseLogger)

fastify.addHook('onRequest', (request, reply, done) => {
  runWithContext({ requestId: request.id }, () => {
    const logger = getRequestLogger()
    logger.info({ req: request.raw }, 'Request started')
    done()
  })
})

fastify.get('/users/:id', async (request, reply) => {
  const logger = getRequestLogger()
  logger.info({ userId: request.params.id }, 'Fetching user')
  return { id: request.params.id }
})
```

## Development vs Production

**Development** (auto-enabled when `NODE_ENV !== 'production'`):
- Pretty-printed output with colors
- Debug level logging
- Human-readable timestamps

**Production**:
- JSON output (structured logging)
- Info level logging
- ISO timestamps
- Optimized for log aggregation (Datadog, Elasticsearch, etc.)

**Force pretty-printing:**
```typescript
const logger = createLogger({ name: 'app', pretty: true })
```

## TypeScript Support

Full type inference with no `any`:

```typescript
import type { Logger, LogContext, LogLevel } from '@yedoma-labs/suruk-logger'

const logger: Logger = createLogger({ name: 'app' })

const context: LogContext = { userId: 'user-123' }
const level: LogLevel = 'info'

logger[level]('Message', context) // ✅ Type-safe
```

## Migrating from Winston

Replace this:
```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
})

logger.info('Message', { meta: 'data' })
```

With this:
```typescript
import { createLogger } from '@yedoma-labs/suruk-logger'

const logger = createLogger({
  name: 'my-service',
  level: 'info'
})

logger.info('Message', { meta: 'data' })
```

**No code changes needed** for basic logging! Just swap the import and constructor.

## Performance

Pino is **5-10x faster** than Winston in most benchmarks:

- Winston: ~10k ops/sec
- Pino: ~50-100k ops/sec
- suruk-logger overhead: <1%

See [Pino benchmarks](https://github.com/pinojs/pino#benchmarks) for details.

## Philosophy

**Zero runtime dependencies** → Pino is a peer dependency. You control the version.

**Winston compatibility** → Drop-in replacement for most Winston use cases.

**TypeScript-first** → Full type inference, no `any`, strict mode.

**Opinionated defaults** → Pretty in dev, JSON in prod. Just works.

## License

MIT © Yedoma Labs

## Related

- [Pino](https://github.com/pinojs/pino) - The underlying fast logger
- [@yedoma-labs/bylyt-env-guard](https://github.com/yedoma-labs/bylyt-env-guard) - Environment variable validation
