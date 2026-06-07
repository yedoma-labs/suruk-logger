import type { LoggerOptions } from 'pino'

export function createDevTransport(): LoggerOptions['transport'] {
  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname',
      singleLine: false,
      messageFormat: '{msg}',
      errorLikeObjectKeys: ['err', 'error'],
    },
  }
}
