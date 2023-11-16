import * as nock from 'nock';

export const nockCtAuth = (times = 1) => {
  return nock('https://auth.europe-west1.gcp.commercetools.com:443', {
    encodedQueryParams: true,
  })
    .post('/oauth/token', 'grant_type=client_credentials')
    .times(times)
    .reply(
      200,
      [
        {
          access_token: 'my-secret-access-token',
          token_type: 'Bearer',
          expires_in: 172491,
          scope: 'manage_project:eagleeye-connector-dev',
        },
      ],
      [],
    );
};
