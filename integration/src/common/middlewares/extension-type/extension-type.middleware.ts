import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { CTActionsBuilder } from '../../providers/commercetools/actions/ActionsBuilder';

@Injectable()
export class ExtensionTypeMiddleware implements NestMiddleware {
  private readonly supportedTypes = ['cart', 'order'];
  private readonly logger = new Logger(ExtensionTypeMiddleware.name);

  use(req: any, res: any, next: () => void) {
    const body = req.body;
    if (!this.supportedTypes.includes(body?.resource?.typeId)) {
      this.logger.log(
        `The received typeId '${body?.resource
          ?.typeId}' is not any of the supported ones: ${this.supportedTypes.join(
          ', ',
        )}`,
      );
      return res.status(200).json(new CTActionsBuilder().build());
    }

    next();
  }
}
