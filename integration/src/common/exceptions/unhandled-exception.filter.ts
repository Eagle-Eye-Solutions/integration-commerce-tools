import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { CTActionsBuilder } from '../../providers/commercetools/actions/ActionsBuilder';
import { Response } from 'express';
import { CartCustomTypeActionBuilder } from '../../providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';

/**
 * Any unhandled exception should still return 200 to avoid breaking the cart API
 */
@Catch()
export class UnhandledExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnhandledExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    this.logger.error('Unhandled error: ', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const actionBuilder = new CTActionsBuilder();
    actionBuilder.add(
      CartCustomTypeActionBuilder.addCustomType({
        errors: [
          {
            type: 'EE_PLUGIN_GENERIC_ERROR',
            message: 'An unexpected error occured in the eagle eye plugin',
          },
        ],
      }),
    );

    response.status(200).json(actionBuilder.build());
  }
}
