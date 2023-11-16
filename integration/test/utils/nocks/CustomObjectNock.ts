import * as nock from 'nock';
import { CUSTOM_OBJECT_NOT_FOUND } from '../data/CustomObjects.data';
import {
  CUSTOM_OBJECT_CIRCUIT_BREAKER_KEY,
  CUSTOM_OBJECT_CONTAINER,
} from '../../../src/common/constants/constants';
import * as _ from 'lodash';

export const nockGetCustomObject = (
  statusCode = 200,
  response: any,
  times = 1,
  container: string = CUSTOM_OBJECT_CONTAINER,
  key: string = CUSTOM_OBJECT_CIRCUIT_BREAKER_KEY,
) => {
  return nock('https://api.europe-west1.gcp.commercetools.com:443', {
    encodedQueryParams: true,
  })
    .get(`/${process.env.CTP_PROJECT_KEY}/custom-objects/${container}/${key}`)
    .times(times)
    .reply(
      statusCode,
      statusCode === 404 ? CUSTOM_OBJECT_NOT_FOUND : response,
      [],
    );
};

export const nockPostCustomObject = (
  statusCode = 200,
  container: string = CUSTOM_OBJECT_CONTAINER,
  key: string = CUSTOM_OBJECT_CIRCUIT_BREAKER_KEY,
) => {
  const timestamp = Date.now();
  return nock('https://api.europe-west1.gcp.commercetools.com:443', {
    encodedQueryParams: true,
  })
    .post(
      `/${process.env.CTP_PROJECT_KEY}/custom-objects`,

      function (body) {
        const expectedBody = {
          key,
          container,
          value: {
            state: {
              name: 'bound callApi',
              enabled: true,
              closed: false,
              open: true,
              halfOpen: false,
              warmUp: false,
              shutdown: false,
            },
          },
        };

        // Delete the lastTimerAt field from the body
        delete body.value.state.lastTimerAt;

        // Compare the rest of the body
        return _.isEqual(body, expectedBody);
      },
    )
    .reply(statusCode, {
      id: 'fa58f10a-1df3-45e2-a49c-2bf06b17d168',
      version: 1,
      createdAt: '2018-09-11T14:12:05.512Z',
      lastModifiedAt: '2018-09-11T14:12:05.512Z',
      container: CUSTOM_OBJECT_CONTAINER,
      key: CUSTOM_OBJECT_CIRCUIT_BREAKER_KEY,
      value: {
        state: {
          name: 'bound callApi',
          enabled: true,
          closed: false,
          open: true,
          halfOpen: false,
          warmUp: false,
          shutdown: false,
          lastTimerAt: timestamp,
        },
      },
    });
};
