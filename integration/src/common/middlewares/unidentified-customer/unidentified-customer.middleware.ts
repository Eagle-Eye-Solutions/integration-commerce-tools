import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { CTActionsBuilder } from '../../providers/commercetools/actions/ActionsBuilder';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UnidentifiedCustomerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(UnidentifiedCustomerMiddleware.name);

  constructor(private configService: ConfigService) {}

  use(req: any, res: any, next: () => void) {
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
      return res.status(200).json(new CTActionsBuilder().build());
    }
    next();
  }
}
