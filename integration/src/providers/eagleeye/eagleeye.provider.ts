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
  public token: Token;
  public campaigns: Campaigns;
  public schemes: Schemes;

  constructor(
    readonly logger: Logger,
    readonly configService: ConfigService,
    readonly httpService: HttpService,
  ) {
    this.wallet = new Wallet(logger, configService, httpService);
    this.token = new Token(logger, configService, httpService);
    this.campaigns = new Campaigns(logger, configService, httpService);
    this.schemes = new Schemes(logger, configService, httpService);
  }
}

export abstract class EagleEyeSdkObject implements BreakableApi {
  public basePath = this.configService.get('eagleEye.walletUrl');
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

  public async invoke(methodName: string, ...args: any[]): Promise<any> {
    if (typeof this[methodName] === 'function') {
      const method = this[methodName];
      return method.apply(this, args);
    } else {
      console.log(`Method '${methodName}' does not exist or is not callable.`);
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
    this.basePath = this.configService.get('eagleEye.posUrl');
    // Binds the object context to the callApi method so that the circuit breaker can access it
    this.invoke = this.invoke.bind(this);
  }

  public async open(body: any) {
    return super.makeApiRequest(`/connect/wallet/open`, 'POST', body);
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
    this.basePath = this.configService.get('eagleEye.walletUrl');
    // Binds the object context to the callApi method so that the circuit breaker can access it
    this.invoke = this.invoke.bind(this);
  }

  public async create(body: any) {
    return super.makeApiRequest(`/token/create`, 'POST', body);
  }
}

export class Campaigns extends EagleEyeSdkObject {
  constructor(
    readonly logger: Logger,
    readonly configService: ConfigService,
    readonly httpService: HttpService,
  ) {
    super(logger, configService, httpService);
    this.basePath = this.configService.get('eagleEye.resourcesUrl');
    // Binds the object context to the callApi method so that the circuit breaker can access it
    this.invoke = this.invoke.bind(this);
  }

  public async get() {
    return super.makeApiRequest(`/campaigns`, 'GET', undefined);
  }
}

export class Schemes extends EagleEyeSdkObject {
  constructor(
    readonly logger: Logger,
    readonly configService: ConfigService,
    readonly httpService: HttpService,
  ) {
    super(logger, configService, httpService);
    this.basePath = this.configService.get('eagleEye.resourcesUrl');
    // Binds the object context to the callApi method so that the circuit breaker can access it
    this.invoke = this.invoke.bind(this);
  }

  public async get() {
    return super.makeApiRequest(`/schemes/points`, 'GET', undefined);
  }
}
