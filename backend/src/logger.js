import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : (process.env.LOG_LEVEL || (isProd ? 'info' : 'debug')),
  transport: (!isProd && !isTest)
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYSTEM:standard', ignore: 'pid,hostname' },
      }
    : undefined,
  base: { service: 'backend-taskdb' },
});
