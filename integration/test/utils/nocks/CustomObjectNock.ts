import * as nock from 'nock';
import { CUSTOM_OBJECT_NOT_FOUND } from '../data/CustomObjects.data';
import {
  CUSTOM_OBJECT_CIRCUIT_BREAKER_KEY,
  CUSTOM_OBJECT_CONTAINER_CIRCUIT_BREAKER,
} from '../../../src/common/constants/constants';
import * as _ from 'lodash';

export const nockGetCustomObject = (
  statusCode = 200,
  response?: any,
  times = 1,
  container: string = CUSTOM_OBJECT_CONTAINER_CIRCUIT_BREAKER,
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

export const nockQueryCustomObjects = (
  statusCode = 200,
  query?: any,
  response?: any,
  times = 1,
) => {
  return nock('https://api.europe-west1.gcp.commercetools.com:443', {
    encodedQueryParams: true,
  })
    .get(`/${process.env.CTP_PROJECT_KEY}/custom-objects`)
    .query(query)
    .times(times)
    .reply(statusCode, response || {}, []);
};

export const nockDeleteCustomObject = (
  key: string,
  container: string,
  response: any,
  times = 1,
  statusCode = 200,
) => {
  return nock('https://api.europe-west1.gcp.commercetools.com:443', {
    encodedQueryParams: true,
  })
    .delete(
      `/${process.env.CTP_PROJECT_KEY}/custom-objects/${container}/${key}`,
    )
    .times(times)
    .reply(statusCode, response, []);
};

export const nockPostEnrichedBasketCustomObject = (body?: any) => {
  return nock('https://api.europe-west1.gcp.commercetools.com:443', {
    encodedQueryParams: true,
  })
    .persist()
    .post(
      `/${process.env.CTP_PROJECT_KEY}/custom-objects`,
      body || {
        key: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
        container: 'eagleeye-cart',
        value: {
          enrichedBasket: {
            type: 'STANDARD',
            summary: {
              redemptionChannel: 'Online',
              totalDiscountAmount: {
                general: null,
                staff: null,
                promotions: 300,
              },
              totalItems: 7,
              totalBasketValue: 6138,
              adjustmentResults: [
                { resourceId: '1669988', value: 200 },
                { value: 500 },
              ],
            },
            contents: [
              {
                upc: '245865',
                adjustmentResults: [
                  {
                    resourceId: '123456',
                    totalDiscountAmount: 100,
                  },
                ],
              },
              {
                upc: '245879',
                adjustmentResults: [{ totalDiscountAmount: 250 }],
              },
            ],
          },
          cart: { typeId: 'cart', id: '8be07418-04a0-49ba-b56f-2aa35d1027a4' },
        },
      },
    )
    .reply(
      200,
      {
        id: 'b54fee86-f295-48b9-ad94-e5fad3191ad7',
        version: 4,
        versionModifiedAt: '2023-11-29T12:10:58.869Z',
        createdAt: '2023-11-29T11:26:33.883Z',
        lastModifiedAt: '2023-11-29T12:10:58.869Z',
        lastModifiedBy: {
          clientId: 'Uy9RaeGH91kFO3und4o-K55R',
          isPlatformClient: false,
        },
        createdBy: {
          clientId: 'Uy9RaeGH91kFO3und4o-K55R',
          isPlatformClient: false,
        },
        container: 'eagleeye-cart',
        key: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
        value: {
          enrichedBasket: {
            type: 'ENRICHED',
            summary: {
              redemptionChannel: 'Online',
              totalDiscountAmount: { promotions: 1133 },
              totalItems: 2,
              totalBasketValue: 4405,
              qualifiesResults: [
                { instanceId: '1744391-1', totalMatchingSpend: 100 },
              ],
              adjustmentResults: [
                {
                  resourceType: 'CAMPAIGN',
                  resourceId: '1744391',
                  instanceId: '1744391-1',
                  relatedAccountIds: [],
                  type: 'createRedeem',
                  multiItem: [],
                  value: 883,
                  isUnredeemable: false,
                  playOrderPosition: 2,
                  totalDiscountAmount: 883,
                },
              ],
              results: {
                points: {
                  spend: 0,
                  debit: 0,
                  refund: 0,
                  totalPointsTaken: 0,
                  earn: 0,
                  credit: 0,
                  totalPointsGiven: 0,
                  totalMonetaryValue: 0,
                },
              },
            },
            contents: [
              {
                upc: '245865',
                itemUnitCost: 1000,
                totalUnitCostAfterDiscount: 4000,
                totalUnitCost: 4000,
                description: 'Farm Fresh Cheddar Cheese 500g',
                itemUnitMetric: 'EACH',
                itemUnitCount: 4,
                salesKey: 'SALE',
                contributionResults: [{ instanceId: '1744391-1', value: 601 }],
              },
              {
                upc: '245877',
                itemUnitCost: 546,
                totalUnitCostAfterDiscount: 1638,
                totalUnitCost: 1638,
                description: 'Bottled Still Water',
                itemUnitMetric: 'EACH',
                itemUnitCount: 3,
                salesKey: 'SALE',
                contributionResults: [{ instanceId: '1744391-1', value: 245 }],
              },
              {
                upc: '245879',
                itemUnitCost: 500,
                totalUnitCostAfterDiscount: 250,
                totalUnitCost: 500,
                description: 'Shipping method',
                itemUnitMetric: 'EACH',
                itemUnitCount: 1,
                salesKey: 'SALE',
                qualifiesResults: [
                  {
                    instanceId: '1736971-1',
                    totalMatchingUnits: 1,
                    totalMatchingSpend: 1,
                  },
                ],
                adjustmentResults: [
                  {
                    resourceType: 'CAMPAIGN',
                    resourceId: '1736971',
                    instanceId: '1736971-1',
                    relatedAccountIds: [],
                    type: 'createRedeem',
                    multiItem: [],
                    value: 250,
                    isUnredeemable: false,
                    totalMatchingUnits: 1,
                    playOrderPosition: 1,
                    totalDiscountAmount: 250,
                  },
                ],
                itemUnitDiscount: 250,
                contributionResults: [{ instanceId: '1744391-1', value: 37 }],
              },
            ],
            analysedDateTime: '2023-11-29T12:10:58+00:00',
          },
          cart: {
            typeId: 'cart',
            id: '8be07418-04a0-49ba-b56f-2aa35d1027a4',
          },
        },
      },
      [],
    );
};

export const nockGetEnrichedBasketCustomObject = () => {
  return nock('https://api.europe-west1.gcp.commercetools.com:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get(
      `/${process.env.CTP_PROJECT_KEY}/custom-objects/eagleeye-cart/45311522-50f6-4aa1-9aba-add802387c1c`,
    )
    .reply(
      200,
      {
        id: 'b54fee86-f295-48b9-ad94-e5fad3191ad7',
        version: 4,
        versionModifiedAt: '2023-11-29T12:10:58.869Z',
        createdAt: '2023-11-29T11:26:33.883Z',
        lastModifiedAt: '2023-11-29T12:10:58.869Z',
        lastModifiedBy: {
          clientId: 'Uy9RaeGH91kFO3und4o-K55R',
          isPlatformClient: false,
        },
        createdBy: {
          clientId: 'Uy9RaeGH91kFO3und4o-K55R',
          isPlatformClient: false,
        },
        container: 'eagleeye-cart',
        key: '45311522-50f6-4aa1-9aba-add802387c1c',
        value: {
          enrichedBasket: {
            type: 'ENRICHED',
            summary: {
              redemptionChannel: 'Online',
              totalDiscountAmount: { promotions: 1133 },
              totalItems: 2,
              totalBasketValue: 4405,
              qualifiesResults: [
                { instanceId: '1744391-1', totalMatchingSpend: 100 },
              ],
              adjustmentResults: [
                {
                  resourceType: 'CAMPAIGN',
                  resourceId: '1744391',
                  instanceId: '1744391-1',
                  relatedAccountIds: [],
                  type: 'createRedeem',
                  multiItem: [],
                  value: 883,
                  isUnredeemable: false,
                  playOrderPosition: 2,
                  totalDiscountAmount: 883,
                },
              ],
              results: {
                points: {
                  spend: 0,
                  debit: 0,
                  refund: 0,
                  totalPointsTaken: 0,
                  earn: 0,
                  credit: 0,
                  totalPointsGiven: 0,
                  totalMonetaryValue: 0,
                },
              },
            },
            contents: [
              {
                upc: '245865',
                itemUnitCost: 1000,
                totalUnitCostAfterDiscount: 4000,
                totalUnitCost: 4000,
                description: 'Farm Fresh Cheddar Cheese 500g',
                itemUnitMetric: 'EACH',
                itemUnitCount: 4,
                salesKey: 'SALE',
                contributionResults: [{ instanceId: '1744391-1', value: 601 }],
              },
              {
                upc: '245877',
                itemUnitCost: 546,
                totalUnitCostAfterDiscount: 1638,
                totalUnitCost: 1638,
                description: 'Bottled Still Water',
                itemUnitMetric: 'EACH',
                itemUnitCount: 3,
                salesKey: 'SALE',
                contributionResults: [{ instanceId: '1744391-1', value: 245 }],
              },
              {
                upc: '245879',
                itemUnitCost: 500,
                totalUnitCostAfterDiscount: 250,
                totalUnitCost: 500,
                description: 'Shipping method',
                itemUnitMetric: 'EACH',
                itemUnitCount: 1,
                salesKey: 'SALE',
                qualifiesResults: [
                  {
                    instanceId: '1736971-1',
                    totalMatchingUnits: 1,
                    totalMatchingSpend: 1,
                  },
                ],
                adjustmentResults: [
                  {
                    resourceType: 'CAMPAIGN',
                    resourceId: '1736971',
                    instanceId: '1736971-1',
                    relatedAccountIds: [],
                    type: 'createRedeem',
                    multiItem: [],
                    value: 250,
                    isUnredeemable: false,
                    totalMatchingUnits: 1,
                    playOrderPosition: 1,
                    totalDiscountAmount: 250,
                  },
                ],
                itemUnitDiscount: 250,
                contributionResults: [{ instanceId: '1744391-1', value: 37 }],
              },
            ],
            analysedDateTime: '2023-11-29T12:10:58+00:00',
          },
          cart: {
            typeId: 'cart',
            id: '45311522-50f6-4aa1-9aba-add802387c1c',
          },
        },
      },
      [],
    );
};

export const nockPostCircuitStateCustomObject = (
  statusCode = 200,
  container: string = CUSTOM_OBJECT_CONTAINER_CIRCUIT_BREAKER,
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
              name: 'bound invoke',
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
        delete body?.value?.state?.lastTimerAt;

        // Compare the rest of the body
        return _.isEqual(body, expectedBody);
      },
    )
    .reply(statusCode, {
      id: 'fa58f10a-1df3-45e2-a49c-2bf06b17d168',
      version: 1,
      createdAt: '2018-09-11T14:12:05.512Z',
      lastModifiedAt: '2018-09-11T14:12:05.512Z',
      container: CUSTOM_OBJECT_CONTAINER_CIRCUIT_BREAKER,
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
