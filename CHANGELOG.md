# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-06-07

### Added
- Enhanced `error()` and `fatal()` methods now accept additional context fields as third parameter
  - New signature: `logger.error(err: Error, msg: string, fields: LogContext)`
  - New signature: `logger.fatal(err: Error, msg: string, fields: LogContext)`
  - Allows logging errors with rich contextual data in a single call
- Comprehensive field redaction documentation in README
  - Top-level field redaction examples
  - Exact nested path redaction patterns
  - Wildcard patterns for any nesting level (`*.password`, `*.*.password`)
  - Production-ready redaction configuration examples
  - Security best practices and performance considerations
- New example file: `examples/error-with-context.ts`
  - Demonstrates error logging with additional context fields
  - Shows real-world use cases (database errors, API failures, file system errors)
- Enhanced `examples/redaction.ts` with wildcard pattern demonstrations
  - Shows top-level, exact path, and wildcard redaction strategies
  - Includes before/after examples and explanations

### Changed
- README now includes comprehensive "Field Redaction" section
  - Documents all redaction strategies with examples
  - Includes comparison table for when to use each strategy
  - Added production-ready redaction configuration template
- Error logging examples in README updated to show new context fields feature

### Fixed
- Type definitions now properly support error logging with context fields

## [0.1.0] - 2026-06-07

### Added
- Initial release
- Winston-compatible logging API (`debug`, `info`, `warn`, `error`, `fatal`)
- AsyncLocalStorage-based request context binding
- Default serializers for errors, requests, and responses
- Child logger support with context inheritance
- TypeScript-first with full type inference
- Auto-detect development vs production mode
- Pretty-printing in development (pino-pretty)
- JSON structured logging in production
- Zero runtime dependencies (Pino as peer dependency)
- Express/Fastify integration examples
- Comprehensive test suite with Vitest
- GitHub Actions CI/CD workflows

### Features
- `createLogger()` - Create Winston-compatible Pino logger
- `runWithContext()` - Execute function with async local context
- `getContext()` - Access current request context
- `setContextValue()` - Add values to current context
- `bindRequestContext()` - Bind request ID and fields
- `setRequestLogger()` - Configure base logger for requests
- `getRequestLogger()` - Get logger with context applied
- `logger.child()` - Create child loggers with inherited context

[Unreleased]: https://github.com/yedoma-labs/suruk-logger/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yedoma-labs/suruk-logger/releases/tag/v0.1.0
