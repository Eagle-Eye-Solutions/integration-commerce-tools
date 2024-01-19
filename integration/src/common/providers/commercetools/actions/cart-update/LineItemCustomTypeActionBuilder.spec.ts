import { BaseResource, LineItem } from '@commercetools/platform-sdk';
import { LOYALTY_CREDIT_TYPE } from '../../../../../adjudication/types/loyalty-earn-credits.type';
import {
  CustomFieldsObject,
  LineItemCustomTypeActionBuilder,
} from './LineItemCustomTypeActionBuilder';

describe('LineItemCustomTypeActionBuilder', () => {
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

describe('LineItemCustomTypeActionBuilder > loyaltyCredits', () => {
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

    expect(actions).toMatchSnapshot();
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

    expect(actions).toMatchSnapshot();
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

    expect(actions).toMatchSnapshot();
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

    expect(actions).toMatchSnapshot();
  });
});

describe('LineItemCustomTypeActionBuilder > promotions', () => {
  it('should add line item promotions', () => {
    const customFieldsObject: CustomFieldsObject = {
      promotions: {
        appliedDiscounts: new Map([['sku1', ['sku1 promo']]]),
      },
    };
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
        fields: {
          'eagleeye-appliedDiscounts': ['sku1 promo'],
          'eagleeye-loyaltyCredits': '',
        },
        lineItemId: 'lineItemId1',
        type: {
          key: 'custom-line-item-type',
          typeId: 'type',
        },
      },
      {
        action: 'setLineItemCustomType',
        fields: {
          'eagleeye-appliedDiscounts': [],
          'eagleeye-loyaltyCredits': '',
        },
        lineItemId: 'lineItemId2',
        type: {
          key: 'custom-line-item-type',
          typeId: 'type',
        },
      },
    ]);
  });
});
