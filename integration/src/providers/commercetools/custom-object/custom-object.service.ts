import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Commercetools } from '../commercetools.provider';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class CustomObjectService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private commercetools: Commercetools,
  ) {}

  saveCustomObject = async (
    key: string,
    container: string,
    value: any,
    version?: number,
  ) => {
    const customObjectDraft = {
      body: {
        key,
        container,
        value: value,
        version,
      },
    };
    this.logger.debug({
      message: 'Creating custom object draft',
      customObjectDraft,
    });
    return this.commercetools
      .getApiRoot()
      .customObjects()
      .post(customObjectDraft)
      .execute();
  };

  getCustomObject = async (container: string, key: string) => {
    return this.commercetools
      .getApiRoot()
      .customObjects()
      .withContainerAndKey({
        container,
        key,
      })
      .get()
      .execute();
  };

  deleteCustomObject = async (
    container: string,
    key: string,
    version?: number,
  ) => {
    return this.commercetools
      .getApiRoot()
      .customObjects()
      .withContainerAndKey({
        container,
        key,
      })
      .delete({
        queryArgs: {
          version,
        },
      })
      .execute();
  };
}
