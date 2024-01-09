import { TypeDraft } from '@commercetools/platform-sdk';

export interface TypeDefinitionInterface {
  getTypeKey(): string;

  getTypeDraft(): TypeDraft;
}
