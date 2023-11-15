import { Injectable, Logger } from '@nestjs/common';
import { Commercetools } from '../commercetools.provider';
import { Type, TypeDraft } from '@commercetools/platform-sdk';

@Injectable()
export class CustomTypeService {
  private readonly logger = new Logger(CustomTypeService.name);

  constructor(private readonly commercetools: Commercetools) {}

  async create(typeDefinition: TypeDraft): Promise<Type> {
    const ctClient = this.commercetools.getApiRoot();

    const getType = await ctClient
      .types()
      .withKey({ key: typeDefinition.key })
      .get()
      .execute();
    if (getType?.body?.key) {
      this.logger.log(
        `Ignoring creation of type '${typeDefinition.key}' as already exists in commercetools`,
      );
      return;
    }

    const response = await ctClient
      .types()
      .post({ body: typeDefinition })
      .execute();
    if (![200, 201].includes(response.statusCode)) {
      const errorMsg = `Type: "${typeDefinition.key}" could not be created`;
      this.logger.error({
        msg: errorMsg,
        statusCode: response.statusCode,
        body: response.body,
      });
      throw new Error(errorMsg);
    }

    this.logger.debug({
      msg: `Type: "${typeDefinition.key}" created`,
      type: response.body,
    });

    return response.body;
  }
}
