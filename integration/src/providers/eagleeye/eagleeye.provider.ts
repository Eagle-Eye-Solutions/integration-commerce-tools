import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { BreakableApi } from '../circuit-breaker/interfaces/breakable-api.interface';
import { ConfigService } from '@nestjs/config';
import { EagleEyeApiException } from '../../common/exceptions/eagle-eye-api.exception';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, retry } from 'rxjs';

// TODO: move this with other types to a proper directory
export type EagleEyeCredentials = {
  clientId: string;
  clientSecret: string;
};

export class EagleEyeApiClient {
  public wallet: Wallet;
  public token: Token;

  constructor(
    readonly logger: Logger,
    readonly configService: ConfigService,
    readonly httpService: HttpService,
  ) {
    this.wallet = new Wallet(logger, configService, httpService);
    this.token = new Token(logger, configService, httpService);
  }
}

export abstract class EagleEyeSdkObject implements BreakableApi {
  // TODO: add environment variables or configurations for these URLs
  public basePath = 'https://wallet.sandbox.uk.eagleeye.com';
  private credentials: EagleEyeCredentials;

  protected constructor(
    readonly logger: Logger,
    readonly configService: ConfigService,
    readonly httpService: HttpService,
  ) {
    this.credentials = {
      clientId: this.configService.get<string>('eagleEye.clientId'),
      clientSecret: this.configService.get<string>('eagleEye.clientSecret'),
    };
  }

  public getAuthenticationHash(
    requestUrl: string,
    requestBody: Record<string, any>,
  ) {
    const preHashedString =
      requestUrl +
      (requestBody ? JSON.stringify(requestBody) : '') +
      this.credentials.clientSecret;
    return createHash('sha256').update(preHashedString).digest('hex');
  }

  public async callApi(url: string, method: string, body: Record<string, any>) {
    try {
      const response = this.httpService
        .request({
          url: `${this.basePath}${url}`,
          method,
          data: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
            'X-EES-AUTH-CLIENT-ID': this.credentials.clientId,
            'X-EES-AUTH-HASH': this.getAuthenticationHash(url, body),
          },
        })
        .pipe(
          retry({
            count: 0, // retries currently disabled
            delay: 0, // delay between retries in milliseconds
          }),
        );
      const value = await firstValueFrom(response);
      return value.data;
    } catch (err) {
      this.logger.error('EagleEye API error: ', err, EagleEyeSdkObject.name);
      throw new EagleEyeApiException(
        'EE_API_UNAVAILABLE',
        'Error calling EagleEye API',
      );
    }
  }
}

@Injectable()
export class Wallet extends EagleEyeSdkObject {
  constructor(
    readonly logger: Logger,
    readonly configService: ConfigService,
    readonly httpService: HttpService,
  ) {
    super(logger, configService, httpService);
    this.basePath = 'https://pos.sandbox.uk.eagleeye.com';
    // Binds the object context to the callApi method so that the circuit breaker can access it
    this.callApi = this.callApi.bind(this);
  }

  public async callApi(body: any) {
    return super.callApi(`/connect/wallet/open`, 'POST', body);
  }
}

@Injectable()
export class Token extends EagleEyeSdkObject {
  constructor(
    readonly logger: Logger,
    readonly configService: ConfigService,
    readonly httpService: HttpService,
  ) {
    super(logger, configService, httpService);
    this.basePath = 'https://wallet.sandbox.uk.eagleeye.com';
  }

  public async callApi(body: any) {
    return super.callApi(`/token/create`, 'POST', body);
  }
}
