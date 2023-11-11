import { Logger } from '@nestjs/common';
import {
  EagleEye,
  EagleEyeCredentials,
  EagleEyeApiClient,
  Wallet,
  WalletServices,
  Token,
} from './eagleeye.provider';

describe('EagleEye', () => {
  let logger: Logger;
  let eagleEye: EagleEye;

  beforeEach(() => {
    logger = new Logger();
    eagleEye = new EagleEye(logger);
  });

  it('should create an instance of EagleEye', () => {
    expect(eagleEye).toBeInstanceOf(EagleEye);
  });

  it('should create an instance of EagleEyeApiClient when calling withCredentials', () => {
    const credentials: EagleEyeCredentials = {
      clientId: 'testClientId',
      clientSecret: 'testClientSecret',
    };
    const apiClient = eagleEye.withCredentials(credentials).getClient();
    expect(apiClient).toBeInstanceOf(EagleEyeApiClient);
  });
});

describe('EagleEyeApiClient', () => {
  let logger: Logger;
  let credentials: EagleEyeCredentials;
  let apiClient: EagleEyeApiClient;

  beforeEach(() => {
    logger = new Logger();
    credentials = {
      clientId: 'testClientId',
      clientSecret: 'testClientSecret',
    };
    apiClient = new EagleEyeApiClient(credentials, logger);
  });

  it('should create an instance of EagleEyeApiClient', () => {
    expect(apiClient).toBeInstanceOf(EagleEyeApiClient);
  });

  it('should create an instance of Wallet and Token', () => {
    expect(apiClient.wallet).toBeInstanceOf(Wallet);
    expect(apiClient.token).toBeInstanceOf(Token);
  });
});

describe('Wallet', () => {
  let logger: Logger;
  let credentials: EagleEyeCredentials;
  let wallet: Wallet;

  beforeEach(() => {
    logger = new Logger();
    credentials = {
      clientId: 'testClientId',
      clientSecret: 'testClientSecret',
    };
    wallet = new Wallet(credentials, logger);
    fetchMock.resetMocks();
  });

  it('should call makeEagleEyeRequest with the correct parameters when calling open', async () => {
    const body = {
      /* test body */
    };
    const url = '/connect/wallet/open';
    const fullUrl = `${wallet.basePath}${url}`;
    const method = 'POST';

    fetchMock.mockResponseOnce(JSON.stringify({}));

    await wallet.open(body);

    expect(fetchMock).toHaveBeenCalledWith(fullUrl, {
      method,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'X-EES-AUTH-CLIENT-ID': 'testClientId',
        'X-EES-AUTH-HASH': wallet.getAuthenticationHash(url, body),
      },
      options: {},
      retryOn: [429, 503],
    });
  });
});

describe('WalletServices', () => {
  let logger: Logger;
  let credentials: EagleEyeCredentials;
  let walletServices: WalletServices;

  beforeEach(() => {
    logger = new Logger();
    credentials = {
      clientId: 'testClientId',
      clientSecret: 'testClientSecret',
    };
    walletServices = new WalletServices(credentials, logger);
    fetchMock.resetMocks();
  });

  it('should call makeEagleEyeRequest with the correct parameters when calling createWithAccount', async () => {
    const body = {
      /* test body */
    };
    const url = '/services/wallet/accounts';
    const fullUrl = `${walletServices.basePath}${url}`;
    const method = 'POST';

    fetchMock.mockResponseOnce(JSON.stringify({}));

    await walletServices.createWithAccount(body);

    expect(fetchMock).toHaveBeenCalledWith(fullUrl, {
      method,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'X-EES-AUTH-CLIENT-ID': 'testClientId',
        'X-EES-AUTH-HASH': walletServices.getAuthenticationHash(url, body),
      },
      options: {},
      retryOn: [429, 503],
    });
  });
});

describe('Token', () => {
  let logger: Logger;
  let credentials: EagleEyeCredentials;
  let token: Token;

  beforeEach(() => {
    logger = new Logger();
    credentials = {
      clientId: 'testClientId',
      clientSecret: 'testClientSecret',
    };
    token = new Token(credentials, logger);
    fetchMock.resetMocks();
  });

  it('should call makeEagleEyeRequest with the correct parameters when calling create', async () => {
    const body = {
      /* test body */
    };
    const url = '/token/create';
    const fullUrl = `${token.basePath}${url}`;
    const method = 'POST';

    fetchMock.mockResponseOnce(JSON.stringify({}));

    await token.create(body);

    expect(fetchMock).toHaveBeenCalledWith(fullUrl, {
      method,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'X-EES-AUTH-CLIENT-ID': 'testClientId',
        'X-EES-AUTH-HASH': token.getAuthenticationHash(url, body),
      },
      options: {},
      retryOn: [429, 503],
    });
  });
});
