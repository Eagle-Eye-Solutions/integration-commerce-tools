import { TypeDraft } from '@commercetools/platform-sdk';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { TypeDefinitionInterface } from './type-definition.interface';

export const FIELD_EAGLEEYE_LOYALTY_CREDITS = 'eagleeye-loyaltyCredits';
export const TYPE_LINE_ITEM = 'custom-line-item-type';

@Injectable()
export class LineItemTypeDefinition implements TypeDefinitionInterface {
  constructor(private readonly configService: ConfigService) {}

  getTypeKey(): string {
    return (
      this.configService.get<string>('commercetools.lineItemTypeKey') ||
      TYPE_LINE_ITEM
    );
  }

  getTypeDraft(): TypeDraft {
    return {
      key: this.getTypeKey(),
      name: {
        en: 'Eagle Eye',
      },
      description: {
        en: 'Eagle Eye custom type',
      },
      resourceTypeIds: ['line-item'],
      fieldDefinitions: [
        {
          name: FIELD_EAGLEEYE_LOYALTY_CREDITS,
          label: {
            en: 'eagleeye-loyaltyCredits',
          },
          required: false,
          type: {
            name: 'String',
          },
          inputHint: 'SingleLine',
        },
      ],
    };
  }
}
