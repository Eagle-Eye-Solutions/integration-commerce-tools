import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('fetch-retry')(global.fetch);

@Injectable()
export class EagleEye {
  private logger = new Logger(EagleEye.name);

  public async makeEagleEyeRequest(url, method, body, options) {
    try {
      const response = await fetch(url, {
        method,
        body: JSON.stringify(body),
        options,
        retryDelay: function (attempt) {
          return Math.pow(2, attempt) * 1000;
        },
        retryOn: [429, 503],
      });
      const result = await response.json();
      this.logger.log(result);
    } catch (err) {
      this.logger.error(err);
    }
  }
}
