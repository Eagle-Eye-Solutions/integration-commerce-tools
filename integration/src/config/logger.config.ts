import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import { format, transports } from 'winston';
import { APP_NAME } from '../common/constants/constants';
import * as Transport from 'winston-transport';
import { version } from '../../package.json';

const gcpTransport = new winston.transports.Console({
  level: process.env.LOG_LEVEL ?? 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((info) => {
      const { timestamp, level, context, message, ...meta } = info;

      return JSON.stringify({
        message: `[${context}] ${message}`,
        severity: level.toUpperCase(),
        timestamp,
        serviceContext: { service: APP_NAME, version },
        context,
        ...meta,
      });
    }),
  ),
});

export const loggerConfig: { transports: Transport[] } = {
  transports: [
    ['dev', 'test'].includes(process.env.NODE_ENV)
      ? new transports.Console({
          level: 'debug',
          format: format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike(APP_NAME, {
              colors: true,
              prettyPrint: true,
            }),
          ),
        })
      : gcpTransport,
  ],
};
