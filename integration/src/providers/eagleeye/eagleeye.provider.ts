import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('fetch-retry')(global.fetch);

// TODO: move this with other types to a proper directory
export type EagleEyeCredentials = {
  clientId: string;
  clientSecret: string;
};

@Injectable()
export class EagleEye {
  private apiClient: EagleEyeApiClient;

  constructor(private logger: Logger) {}

  public withOptions() {
    return {
      withCredentials: this.withCredentials,
    };
  }

  public withCredentials(credentials: EagleEyeCredentials) {
    if (!this.apiClient) {
      this.apiClient = new EagleEyeApiClient(credentials, this.logger);
    }
    return {
      getClient: () => {
        return this.apiClient;
      },
    };
  }
}

export class EagleEyeApiClient {
  private credentials: EagleEyeCredentials;
  public wallet;
  public token;

  constructor(credentials: EagleEyeCredentials, logger: Logger) {
    this.credentials = credentials;
    this.wallet = new Wallet(this.credentials, logger);
    this.token = new Token(this.credentials, logger);
  }
}

export class EagleEyeSdkObject {
  // TODO: add environment variables or configurations for these URLs
  public basePath = 'https://wallet.sandbox.uk.eagleeye.com';
  credentials: EagleEyeCredentials;

  // eslint-disable-next-line prettier/prettier
  constructor(
    credentials,
    readonly logger: Logger,
  ) {
    this.credentials = credentials;
  }

  public getAuthenticationHash(requestUrl, requestBody) {
    const preHashedString =
      requestUrl +
      (requestBody ? JSON.stringify(requestBody) : '') +
      this.credentials.clientSecret;
    const hashedString = createHash('sha256')
      .update(preHashedString)
      .digest('hex');
    return hashedString;
  }

  public async makeEagleEyeRequest(url, method, body, options) {
    try {
      const response = await fetch(`${this.basePath}${url}`, {
        method,
        body: JSON.stringify(body),
        options,
        headers: {
          'Content-Type': 'application/json',
          'X-EES-AUTH-CLIENT-ID': this.credentials.clientId,
          'X-EES-AUTH-HASH': this.getAuthenticationHash(url, body),
        },
        retryOn: [429, 503],
      });
      const result = await response.json();
      return result;
    } catch (err) {
      this.logger.error(err);
    }
  }
}

export class Wallet extends EagleEyeSdkObject {
  services = new WalletServices(this.credentials, this.logger);

  constructor(credentials, logger: Logger) {
    super(credentials, logger);
    this.basePath = 'https://pos.sandbox.uk.eagleeye.com';
  }

  public async open(body) {
    return super.makeEagleEyeRequest(`/connect/wallet/open`, 'POST', body, {});
  }
}

export class WalletServices extends EagleEyeSdkObject {
  constructor(credentials, logger: Logger) {
    super(credentials, logger);
    this.basePath = 'https://wallet.sandbox.uk.eagleeye.com';
  }

  public async createWithAccount(body) {
    return super.makeEagleEyeRequest(
      `/services/wallet/accounts`,
      'POST',
      body,
      {},
    );
  }
}

export class Token extends EagleEyeSdkObject {
  constructor(credentials, logger: Logger) {
    super(credentials, logger);
    this.basePath = 'https://wallet.sandbox.uk.eagleeye.com';
  }

  public async create(body) {
    return super.makeEagleEyeRequest(`/token/create`, 'POST', body, {});
  }
}
