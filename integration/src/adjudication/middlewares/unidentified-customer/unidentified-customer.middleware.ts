import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CartErrorService } from '../../services/cart-error/cart-error.service';

@Injectable()
export class UnidentifiedCustomerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(UnidentifiedCustomerMiddleware.name);

  constructor(
    private configService: ConfigService,
    private cartErrorService: CartErrorService,
  ) {}

  async use(req: any, res: any, next: () => void) {
    const identityValue =
      req.body?.resource?.obj?.custom?.fields?.['eagleeye-identityValue'];
    const voucherCodes =
      req.body?.resource?.obj?.custom?.fields?.['eagleeye-voucherCodes'];
    const potentialVoucherCodes =
      req.body?.resource?.obj?.custom?.fields?.[
        'eagleeye-potentialVoucherCodes'
      ];
    const excludeUnidentifiedCustomers = this.configService.get<boolean>(
      'eagleEye.excludeUnidentifiedCustomers',
    );
    if (
      excludeUnidentifiedCustomers &&
      !identityValue &&
      !voucherCodes?.length &&
      !potentialVoucherCodes?.length
    ) {
      this.logger.debug(`Ignoring request for unidentified customers`);
      const extensionActions = await this.cartErrorService.handleError(
        undefined,
        req.body,
        req.body?.resource?.obj,
      );
      return res.status(200).json(extensionActions);
    }
    next();
  }
}
