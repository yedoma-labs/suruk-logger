import { describe, it, expect } from 'vitest'
import { createDevTransport } from './dev-transport'

describe('Dev Transport', () => {
  it('should return pino-pretty transport configuration', () => {
    const transport = createDevTransport()

    expect(transport).toBeDefined()
    expect(transport).toHaveProperty('target', 'pino-pretty')
  })

  it('should have colorize enabled', () => {
    const transport = createDevTransport()

    expect(transport).toHaveProperty('options')
    expect(transport).toMatchObject({
      options: { colorize: true },
    })
  })

  it('should have all required options', () => {
    const transport = createDevTransport()

    expect(transport).toMatchObject({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
        singleLine: false,
        messageFormat: '{msg}',
        errorLikeObjectKeys: ['err', 'error'],
      },
    })
  })
})
