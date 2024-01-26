import { Injectable, Logger } from '@nestjs/common';
import { Commercetools } from '../commercetools.provider';

@Injectable()
export class CustomObjectService {
  private readonly logger = new Logger(CustomObjectService.name);

  constructor(private commercetools: Commercetools) {}

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

  queryCustomObjects = async (container: string, methodArgs = {}) => {
    return this.commercetools
      .getApiRoot()
      .customObjects()
      .withContainer({ container })
      .get(methodArgs)
      .execute();
  };
}
