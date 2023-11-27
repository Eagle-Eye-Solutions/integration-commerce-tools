import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import { format, transports } from 'winston';
import { APP_NAME } from '../common/constants/constants';
import { createApplicationLogger } from '@commercetools-backend/loggers';
import * as Transport from 'winston-transport';
// import { version } from '../../package.json';

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
      : createApplicationLogger(),
  ],
};
