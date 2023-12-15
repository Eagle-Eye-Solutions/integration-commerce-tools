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
  ) {
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
  ) {
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
      this.logger.error('EagleEye API error: ', err, EagleEyeSdkObject.name);
      if (err.response.status === 404) {
        throw new EagleEyeApiException(
          'EE_IDENTITY_NOT_FOUND',
          'The customer identity doesnt exist in EE AIR Platform',
        );
      }
      throw new EagleEyeApiException(
        'EE_API_UNAVAILABLE',
        'The eagle eye API is unavailable, the cart promotions and loyalty points are NOT updated',
      );
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

  public async open(body: any) {
    return super.makeApiRequest(`/connect/wallet/open`, 'POST', body);
  }

  public async settle(body: any) {
    this.logger.log(`Preparing to call /wallet/settle with payload:`, body);
    return super.makeApiRequest(`/connect/wallet/settle`, 'POST', body);
  }
}
