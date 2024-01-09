import { Inject, Injectable, Logger } from '@nestjs/common';
import { Commercetools } from '../commercetools.provider';
import {
  ClientResponse,
  Type,
  TypeDraft,
  TypeUpdate,
  TypeUpdateAction,
} from '@commercetools/platform-sdk';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import { TypeDefinitionInterface } from './type-definition.interface';

@Injectable()
export class CustomTypeService {
  private readonly logger = new Logger(CustomTypeService.name);
  private updatedTypes: Type[] = [];

  constructor(
    private readonly commercetools: Commercetools,
    @Inject('TypeDefinitions')
    private readonly typeDefinitions: Array<TypeDefinitionInterface>,
  ) {}

  async createUpdateAllTypes(): Promise<any> {
    const ctClient = this.commercetools.getApiRoot();
    for (const type of this.typeDefinitions) {
      this.logger.log(
        `Creating/Updating "${type
          .getTypeDraft()
          .resourceTypeIds.join(
            ',',
          )}" custom type with key: ${type.getTypeKey()}`,
      );
      await this.createUpdateType(type.getTypeDraft(), ctClient);
    }
  }

  async createUpdateType(
    typeDefinition: TypeDraft,
    ctClient: ByProjectKeyRequestBuilder,
  ) {
    let getTypes: ClientResponse<Type>;
    try {
      getTypes = await ctClient
        .types()
        .withKey({ key: typeDefinition.key })
        .get()
        .execute();
    } catch (e) {
      if (e.statusCode) {
        this.logger.log(
          `No types found for resourceIds "${typeDefinition.resourceTypeIds.join(
            ',',
          )}", creating generic type with key "${typeDefinition.key}"`,
        );
        const response = await ctClient
          .types()
          .post({ body: typeDefinition })
          .execute();
        if (![200, 201].includes(response.statusCode)) {
          const errorMsg = `Type with key "${typeDefinition.key}" could not be created`;
          this.logger.error({
            msg: errorMsg,
            statusCode: response.statusCode,
            body: response.body,
          });
          throw new Error(errorMsg);
        }
        this.logger.debug({
          message: `Type with key "${typeDefinition.key}" created`,
          body: response.body,
        });

        return response.body;
      }
    }

    const type = getTypes.body;
    // Add all fields from the latest type definition if they're not already part of this type.
    const addFieldActions: TypeUpdateAction[] = typeDefinition.fieldDefinitions
      .filter(
        (definition) =>
          !type.fieldDefinitions
            .map((def) => def.name)
            .includes(definition.name),
      )
      .map((definition) => {
        return {
          action: 'addFieldDefinition',
          fieldDefinition: definition,
        };
      });

    // Remove all "eagleeye-" fields not present in the latest type definition.
    const removeFieldActions: TypeUpdateAction[] = type.fieldDefinitions
      .filter(
        (definition) =>
          definition.name.startsWith('eagleeye-') &&
          !typeDefinition.fieldDefinitions
            .map((def) => def.name)
            .includes(definition.name),
      )
      .map((definition) => {
        return {
          action: 'removeFieldDefinition',
          fieldName: `${definition.name}`,
        };
      });

    const typeUpdate: { key: string; body: TypeUpdate } = {
      key: type.key,
      body: {
        version: type.version,
        actions: [...addFieldActions, ...removeFieldActions],
      },
    };

    const response = await ctClient
      .types()
      .withKey({ key: typeUpdate.key })
      .post({ body: typeUpdate.body })
      .execute();
    if (![200, 201].includes(response.statusCode)) {
      const errorMsg = `Type with key "${typeUpdate.key}" could not be updated`;
      this.logger.error({
        msg: errorMsg,
        statusCode: response.statusCode,
        body: response.body,
      });
      throw new Error(errorMsg);
    }

    this.logger.log({
      msg: `Type with key "${typeUpdate.key}" updated`,
      type: response.body,
    });
    this.updatedTypes.push(response.body);
    return this.updatedTypes;
  }
}
