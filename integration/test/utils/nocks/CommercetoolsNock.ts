import * as nock from 'nock';

export const nockCtAuth = () => {
  return nock('https://auth.europe-west1.gcp.commercetools.com:443', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/oauth/token', 'grant_type=client_credentials')
    .reply(
      200,
      [
        {
          access_token: 'my-secret-access-token',
          token_type: 'Bearer',
          expires_in: 172491,
          scope: `manage_project:${process.env.CTP_PROJECT_KEY}`,
        },
      ],
      [],
    );
};

export const nockCtGetShippingMethodsWithIds = (ids: string[], times = 1) => {
  return nock('https://api.europe-west1.gcp.commercetools.com:443', {
    encodedQueryParams: false,
  })
    .persist()
    .get(`/${process.env.CTP_PROJECT_KEY}/shipping-methods`)
    .query({
      where: `id in ("${ids.join('","')}")`,
    })
    .times(times)
    .reply(
      200,
      {
        results: [
          {
            key: 'standard-key',
          },
        ],
      },
      [],
    );
};

export const nockCtGetOrderById = (order, times = 1, persist = true) => {
  let nockRequest = nock('https://api.europe-west1.gcp.commercetools.com:443', {
    encodedQueryParams: false,
  });
  if (persist) {
    nockRequest = nockRequest.persist();
  }
  return nockRequest
    .get(`/${process.env.CTP_PROJECT_KEY}/orders/${order.id}`)
    .times(times)
    .reply(200, order, []);
};

export const nockCtUpdateOrderById = (order, body, times = 1) => {
  return nock('https://api.europe-west1.gcp.commercetools.com:443', {
    encodedQueryParams: false,
  })
    .persist()
    .post(`/${process.env.CTP_PROJECT_KEY}/orders/${order.id}`, body)
    .times(times)
    .reply(200, order, []);
};
