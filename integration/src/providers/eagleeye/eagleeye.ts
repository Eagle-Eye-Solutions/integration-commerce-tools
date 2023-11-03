import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('fetch-retry')(global.fetch);

@Injectable()
export class EagleEye {
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
          console.log(json);
        });
    } catch (err) {
      // Do something with error
    }
  }
}
