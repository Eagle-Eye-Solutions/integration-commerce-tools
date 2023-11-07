import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('fetch-retry')(global.fetch);

@Injectable()
export class EagleEye {
  private logger = new Logger(EagleEye.name);

  makeEagleEyeRequest(url) {
    try {
      fetch(url, {
        retryDelay: function (attempt) {
          return Math.pow(2, attempt) * 1000;
        },
        retryOn: [429, 503],
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (json) {
          // Do something with the result
          this.logger.log(json);
        });
    } catch (err) {
      // Do something with error
    }
  }
}
