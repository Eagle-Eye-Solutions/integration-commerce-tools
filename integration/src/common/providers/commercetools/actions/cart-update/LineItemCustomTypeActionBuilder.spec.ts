import { BaseResource, LineItem } from '@commercetools/platform-sdk';
import {
  LOYALTY_CREDIT_TYPE,
  LoyaltyBreakdownObject,
} from '../../../../../adjudication/types/loyalty-earn-credits.type';
import { LineItemCustomTypeActionBuilder } from './LineItemCustomTypeActionBuilder';
import { FIELD_EAGLEEYE_LOYALTY_CREDITS } from '../../custom-type/line-item-type-definition';

interface CustomFieldsObject {
  loyaltyCredits?: LoyaltyBreakdownObject;
}

describe('LineItemCustomTypeActionBuilder', () => {
  it('should build an addCustomType action when total is available in an offer', () => {
    const customFieldsObject: CustomFieldsObject = {
      loyaltyCredits: {
        total: 80,
        offers: [
          { sku: 'sku1', amount: 10, timesRedeemed: 2 },
          { sku: 'sku2', amount: 20, timesRedeemed: 3 },
        ],
      },
    } as any;
    const lineItems: LineItem[] = [
      { id: 'lineItemId1', variant: { sku: 'sku1' } },
      { id: 'lineItemId2', variant: { sku: 'sku2' } },
    ] as any;
    const lineItemTypeKey = 'custom-line-item-type';

    const actions = LineItemCustomTypeActionBuilder.addCustomType(
      customFieldsObject,
      lineItems,
      lineItemTypeKey,
    );

    expect(actions).toEqual([
      {
        action: 'setLineItemCustomType',
        lineItemId: 'lineItemId1',
        type: {
          typeId: 'type',
          key: 'custom-line-item-type',
        },
        fields: {
          [FIELD_EAGLEEYE_LOYALTY_CREDITS]: JSON.stringify({
            total: 20,
            offers: [{ sku: 'sku1', amount: 10, timesRedeemed: 2 }],
          }),
        },
      },
      {
        action: 'setLineItemCustomType',
        lineItemId: 'lineItemId2',
        type: {
          typeId: 'type',
          key: 'custom-line-item-type',
        },
        fields: {
          [FIELD_EAGLEEYE_LOYALTY_CREDITS]: JSON.stringify({
            total: 60,
            offers: [{ sku: 'sku2', amount: 20, timesRedeemed: 3 }],
          }),
        },
      },
    ]);
  });

  it('should build an addCustomType action when total is not available but the offer is in progress', () => {
    const customFieldsObject: CustomFieldsObject = {
      loyaltyCredits: {
        total: 0,
        offers: [
          {
            sku: 'sku1',
            amount: 0,
            timesRedeemed: 1,
            type: LOYALTY_CREDIT_TYPE.IN_PROGRESS,
            totalUnits: 1,
            totalTransactionUnits: 3,
          },
          {
            sku: 'sku2',
            amount: 0,
            timesRedeemed: 1,
            type: LOYALTY_CREDIT_TYPE.IN_PROGRESS,
            totalUnits: 2,
            totalTransactionUnits: 3,
          },
        ],
      },
    } as any;
    const lineItems: LineItem[] = [
      { id: 'lineItemId1', variant: { sku: 'sku1' } },
      { id: 'lineItemId2', variant: { sku: 'sku2' } },
    ] as any;
    const lineItemTypeKey = 'custom-line-item-type';

    const actions = LineItemCustomTypeActionBuilder.addCustomType(
      customFieldsObject,
      lineItems,
      lineItemTypeKey,
    );

    expect(actions).toEqual([
      {
        action: 'setLineItemCustomType',
        lineItemId: 'lineItemId1',
        type: {
          typeId: 'type',
          key: 'custom-line-item-type',
        },
        fields: {
          [FIELD_EAGLEEYE_LOYALTY_CREDITS]: JSON.stringify({
            total: 0,
            offers: [
              {
                sku: 'sku1',
                amount: 0,
                timesRedeemed: 1,
                type: LOYALTY_CREDIT_TYPE.IN_PROGRESS,
                totalUnits: 1,
                totalTransactionUnits: 3,
              },
            ],
          }),
        },
      },
      {
        action: 'setLineItemCustomType',
        lineItemId: 'lineItemId2',
        type: {
          typeId: 'type',
          key: 'custom-line-item-type',
        },
        fields: {
          [FIELD_EAGLEEYE_LOYALTY_CREDITS]: JSON.stringify({
            total: 0,
            offers: [
              {
                sku: 'sku2',
                amount: 0,
                timesRedeemed: 1,
                type: LOYALTY_CREDIT_TYPE.IN_PROGRESS,
                totalUnits: 2,
                totalTransactionUnits: 3,
              },
            ],
          }),
        },
      },
    ]);
  });

  it('should set custom fields for line items when total is available in an offer', () => {
    const customFieldsObject: CustomFieldsObject = {
      loyaltyCredits: {
        total: 80,
        offers: [
          { sku: 'sku1', amount: 10, timesRedeemed: 2 },
          { sku: 'sku2', amount: 20, timesRedeemed: 3 },
        ],
      },
    } as any;
    const lineItems: LineItem[] = [
      { id: 'lineItemId1', variant: { sku: 'sku1' } },
      { id: 'lineItemId2', variant: { sku: 'sku2' } },
    ] as any;

    const actions = LineItemCustomTypeActionBuilder.setCustomFields(
      customFieldsObject,
      lineItems,
    );

    expect(actions).toEqual([
      {
        action: 'setLineItemCustomField',
        lineItemId: 'lineItemId1',
        name: FIELD_EAGLEEYE_LOYALTY_CREDITS,
        value: JSON.stringify({
          total: 20,
          offers: [{ sku: 'sku1', amount: 10, timesRedeemed: 2 }],
        }),
      },
      {
        action: 'setLineItemCustomField',
        lineItemId: 'lineItemId2',
        name: FIELD_EAGLEEYE_LOYALTY_CREDITS,
        value: JSON.stringify({
          total: 60,
          offers: [{ sku: 'sku2', amount: 20, timesRedeemed: 3 }],
        }),
      },
    ]);
  });

  it('should set custom fields for line items when total is not available but the offer is in progress', () => {
    const customFieldsObject: CustomFieldsObject = {
      loyaltyCredits: {
        total: 0,
        offers: [
          {
            sku: 'sku1',
            amount: 0,
            timesRedeemed: 1,
            type: LOYALTY_CREDIT_TYPE.IN_PROGRESS,
            totalUnits: 1,
            totalTransactionUnits: 3,
          },
          {
            sku: 'sku2',
            amount: 0,
            timesRedeemed: 1,
            type: LOYALTY_CREDIT_TYPE.IN_PROGRESS,
            totalUnits: 2,
            totalTransactionUnits: 3,
          },
        ],
      },
    } as any;
    const lineItems: LineItem[] = [
      { id: 'lineItemId1', variant: { sku: 'sku1' } },
      { id: 'lineItemId2', variant: { sku: 'sku2' } },
    ] as any;

    const actions = LineItemCustomTypeActionBuilder.setCustomFields(
      customFieldsObject,
      lineItems,
    );

    expect(actions).toEqual([
      {
        action: 'setLineItemCustomField',
        lineItemId: 'lineItemId1',
        name: FIELD_EAGLEEYE_LOYALTY_CREDITS,
        value: JSON.stringify({
          total: 0,
          offers: [
            {
              sku: 'sku1',
              amount: 0,
              timesRedeemed: 1,
              type: LOYALTY_CREDIT_TYPE.IN_PROGRESS,
              totalUnits: 1,
              totalTransactionUnits: 3,
            },
          ],
        }),
      },
      {
        action: 'setLineItemCustomField',
        lineItemId: 'lineItemId2',
        name: FIELD_EAGLEEYE_LOYALTY_CREDITS,
        value: JSON.stringify({
          total: 0,
          offers: [
            {
              sku: 'sku2',
              amount: 0,
              timesRedeemed: 1,
              type: LOYALTY_CREDIT_TYPE.IN_PROGRESS,
              totalUnits: 2,
              totalTransactionUnits: 3,
            },
          ],
        }),
      },
    ]);
  });

  it('should build a removeCustomType action', () => {
    const action = LineItemCustomTypeActionBuilder.removeCustomType();

    expect(action).toEqual({
      action: 'setCustomType',
    });
  });

  it('should check if a BaseResource already has a custom type', () => {
    const resource: BaseResource = {
      id: 'some-id',
      version: 1,
      custom: {
        type: {
          typeId: 'type',
          id: 'some-other-id',
        },
      },
      createdAt: 'some-date',
      lastModifiedAt: 'some-date',
    } as any;

    const action =
      LineItemCustomTypeActionBuilder.checkResourceCustomType(resource);

    expect(action).toEqual({
      typeId: 'type',
      id: 'some-other-id',
    });
  });
});
