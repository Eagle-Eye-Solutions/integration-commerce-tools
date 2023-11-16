import * as nock from 'nock';

export const nockWalletOpen = (
  times = 1,
  responseCode = 200,
  delayConnection = 0,
) => {
  return nock('https://pos.sandbox.uk.eagleeye.com:443', {
    encodedQueryParams: true,
  })
    .post('/connect/wallet/open', {})
    .times(times)
    .delayConnection(delayConnection)
    .reply(
      responseCode,
      {
        wallet: null,
        identity: null,
        accounts: [],
        additionalEntities: null,
        walletTransactions: [],
        accountTransactions: [],
        analyseBasketResults: null,
        basketAdjudicationResult: null,
        spendAdjudicationResults: null,
      },
      [],
    );
};
