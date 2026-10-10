## [0.3.1](https://github.com/yedoma-labs/suruk-logger/compare/v0.3.0...v0.3.1) (2026-10-10)


### Bug Fixes

* **deps:** override vulnerable transitive dependencies ([#12](https://github.com/yedoma-labs/suruk-logger/issues/12)) ([d27fbc3](https://github.com/yedoma-labs/suruk-logger/commit/d27fbc3a6bd65b1da1e26014ab4ba9e9268462de))

# [0.3.0](https://github.com/yedoma-labs/suruk-logger/compare/v0.2.0...v0.3.0) (2026-10-10)


### Bug Fixes

* adds null checks ([905c95c](https://github.com/yedoma-labs/suruk-logger/commit/905c95c9c01c2a96dadf1cea5532a46b6e60070e))
* **deps:** update vitest and coverage packages to matching versions ([cb346a0](https://github.com/yedoma-labs/suruk-logger/commit/cb346a050714fba9c7f760a3423a489d29f851c4))
* fixes linting ([74188c0](https://github.com/yedoma-labs/suruk-logger/commit/74188c0b2c90beb67308e95844cda87b473f74d1))
* migrates to new biome keys ([19b4109](https://github.com/yedoma-labs/suruk-logger/commit/19b410929525f102cb241aae8727837f95a82714))
* typescript 6.0.3 compatibility - add ignoreDeprecations and types config ([4e1f358](https://github.com/yedoma-labs/suruk-logger/commit/4e1f358e7a04b30fc81e9b4f0c05e989feacdf92))
* typescript 6.0.3 compatibility - add ignoreDeprecations and types config ([3e118c1](https://github.com/yedoma-labs/suruk-logger/commit/3e118c1241de97afae58af5f21104f8d57cd758f))


### Features

* enhanced error logging with context fields and comprehensive redaction docs ([8e54801](https://github.com/yedoma-labs/suruk-logger/commit/8e548015be379cd2103e1d4d1d0abeed6b65f1de))
* migrates biome config ([c7db1af](https://github.com/yedoma-labs/suruk-logger/commit/c7db1af4aa28956064bbed7198b2220620eb136b))
* updates redaction test ([4b5658b](https://github.com/yedoma-labs/suruk-logger/commit/4b5658b995856b75899c19450942405b24e82c51))

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
