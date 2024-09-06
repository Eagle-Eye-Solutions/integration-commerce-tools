import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { BreakableApi } from '../circuit-breaker/interfaces/breakable-api.interface';
import { ConfigService } from '@nestjs/config';
import { EagleEyeApiException } from '../../exceptions/eagle-eye-api.exception';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, retry } from 'rxjs';
import { getEesCalledUniqueIdHeader } from '../../helper/axios-payload-utils';

export type EagleEyeCredentials = {
  clientId: string;
  clientSecret: string;
};

@Injectable()
export class EagleEyeApiClient {
  public wallet: Wallet;

  constructor(
    readonly configService: ConfigService,
    readonly httpService: HttpService,
  ) {
    this.wallet = new Wallet(configService, httpService);
  }
}

export abstract class EagleEyeSdkObject implements BreakableApi {
  public basePath = this.configService.get('eagleEye.walletUrl');
  private credentials: EagleEyeCredentials;
  readonly logger = new Logger(this.constructor.name);

  protected constructor(
    readonly configService: ConfigService,
    readonly httpService: HttpService,
  ) {
    this.credentials = {
      clientId: this.configService.get<string>('eagleEye.clientId'),
      clientSecret: this.configService.get<string>('eagleEye.clientSecret'),
    };
  }

  public async invoke(methodName: string, ...args: any[]): Promise<any> {
    if (typeof this[methodName] === 'function') {
      const method = this[methodName];
      return method.apply(this, args);
    } else {
      const errorString = `Method '${methodName}' does not exist or is not callable.`;
      this.logger.error(errorString);
      throw Error(errorString);
    }
  }

  public getAuthenticationHash(
    requestUrl: string,
    requestBody: Record<string, any>,
  ): string {
    const preHashedString =
      requestUrl +
      (requestBody ? JSON.stringify(requestBody) : '') +
      this.credentials.clientSecret;
    return createHash('sha256').update(preHashedString).digest('hex');
  }

  public async makeApiRequest(
    url: string,
    method: string,
    body: Record<string, any>,
  ): Promise<any> {
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
      return value;
    } catch (err) {
      if (err.response) {
        this.logger.error(
          `EE API returned error with status: ${
            err.response.status
          } and Unique Call ID: ${getEesCalledUniqueIdHeader(err.response)}`,
          {
            body,
            data: err.response.data,
          },
          EagleEyeSdkObject.name,
        );
        switch (err.response.status) {
          case 404:
            throw new EagleEyeApiException(
              'EE_IDENTITY_NOT_FOUND',
              "The customer identity doesn't exist in EE AIR Platform.",
            );
          case 400:
            throw new EagleEyeApiException(
              'EE_BAD_REQUEST',
              'The request could not be processed by the EE AIR Platform.',
            );
          default:
            throw new EagleEyeApiException(
              'EE_UNEXPECTED_ERROR',
              'The request failed to be processed by the EE AIR Platform due to an unexpected error.',
            );
        }
      } else if (err.request) {
        this.logger.error(
          'EagleEye API error: ',
          err.message,
          EagleEyeSdkObject.name,
        );
        throw new EagleEyeApiException(
          'AXIOS_NO_RESPONSE_ERROR',
          'The request to EE AIR Platform failed but Axios did not include a response.',
        );
      } else {
        this.logger.error(
          'EagleEye API unhandled error: ',
          err,
          EagleEyeSdkObject.name,
        );
        throw new EagleEyeApiException(
          'EE_API_UNAVAILABLE',
          'The EE API is unavailable, the cart promotions and loyalty points are NOT updated.',
        );
      }
    }
  }
}

@Injectable()
export class Wallet extends EagleEyeSdkObject {
  constructor(
    readonly configService: ConfigService,
    readonly httpService: HttpService,
  ) {
    super(configService, httpService);
    this.basePath = this.configService.get('eagleEye.posUrl');
    // Binds the object context to the callApi method so that the circuit breaker can access it
    this.invoke = this.invoke.bind(this);
  }

  public async open(body: any): Promise<any> {
    return super.makeApiRequest(`/connect/wallet/open`, 'POST', body);
  }

  public async settle(body: any): Promise<any> {
    this.logger.log(`Preparing to call /wallet/settle with payload:`, body);
    return super.makeApiRequest(`/connect/wallet/settle`, 'POST', body);
  }
}
