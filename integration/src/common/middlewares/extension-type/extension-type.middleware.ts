import { Injectable, NestMiddleware } from '@nestjs/common';
import { CTActionsBuilder } from '../../../providers/commercetools/actions/ActionsBuilder';
import {
  FIELD_EAGLEEYE_ACTION,
  FIELD_EAGLEEYE_SETTLED_STATUS,
} from '../../../providers/commercetools/custom-type/custom-type-definitions';

@Injectable()
export class ExtensionTypeMiddleware implements NestMiddleware {
  private readonly supportedTypes = ['cart', 'order'];

  use(req: any, res: any, next: () => void) {
    const body = req.body;
    if (!this.supportedTypes.includes(body?.resource?.typeId)) {
      //todo use logger
      console.log(
        `The received typeId '${
          body.resource.typeId
        }' is not any of the supported ones: ${this.supportedTypes.join(', ')}`,
      );
      return res.status(200).json(new CTActionsBuilder().build());
    }

    const resourceObj = body?.resource?.obj;
    const objCustomFields = resourceObj?.custom?.fields;
    const orderShouldBeSettled =
      body?.resource?.typeId === 'order' &&
      objCustomFields &&
      objCustomFields[FIELD_EAGLEEYE_SETTLED_STATUS] !== 'SETTLED' &&
      objCustomFields[FIELD_EAGLEEYE_ACTION] === 'SETTLE';
    const cartShouldBeUpdated = body?.resource?.typeId === 'cart';

    if (!orderShouldBeSettled && !cartShouldBeUpdated) {
      return res.status(200).json(new CTActionsBuilder().build());
    }

    next();
  }
}
