import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Commercetools } from '../commercetools.provider';
import { Type, TypeDraft } from '@commercetools/platform-sdk';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class CustomTypeService {
  constructor(
    private readonly commercetools: Commercetools,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

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
      message: `Type: "${typeDefinition.key}" created`,
      body: response.body,
    });

    return response.body;
  }
}
