import { Injectable, Logger } from '@nestjs/common';
import { Commercetools } from '../commercetools.provider';
import {
  Type,
  TypeDraft,
  TypeUpdateAction,
  TypeUpdate,
} from '@commercetools/platform-sdk';

@Injectable()
export class CustomTypeService {
  private readonly logger = new Logger(CustomTypeService.name);
  private updatedTypes: Type[] = [];

  constructor(private readonly commercetools: Commercetools) {}

  async create(typeDefinition: TypeDraft): Promise<Type | Type[]> {
    const ctClient = this.commercetools.getApiRoot();

    const getTypes = await ctClient
      .types()
      .get({
        queryArgs: {
          where: `resourceTypeIds contains any ("${typeDefinition.resourceTypeIds.join(
            '","',
          )}")`,
        },
      })
      .execute();
    if (!getTypes.body.results.length) {
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
        msg: `Type with key "${typeDefinition.key}" created`,
        type: response.body,
      });

      return response.body;
    }

    const typeUpdates: { key: string; body: TypeUpdate }[] =
      getTypes.body.results.map((type: Type) => {
        // Add all fields from the latest type definition if they're not already part of this type.
        const addFieldActions: TypeUpdateAction[] =
          typeDefinition.fieldDefinitions
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

        return {
          key: type.key,
          body: {
            version: type.version,
            actions: [...addFieldActions, ...removeFieldActions],
          },
        };
      });

    for (const typeUpdate of typeUpdates) {
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
    }
    return this.updatedTypes;
  }
}
