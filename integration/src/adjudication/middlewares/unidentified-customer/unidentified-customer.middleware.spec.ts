import { UnidentifiedCustomerMiddleware } from './unidentified-customer.middleware';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CartErrorService } from '../../services/cart-error/cart-error.service';
import { BASKET_STORE_SERVICE } from '../../../common/services/basket-store/basket-store.provider';
import { CartTypeDefinition } from '../../../common/providers/commercetools/custom-type/cart-type-definition';
import { LineItemTypeDefinition } from '../../../common/providers/commercetools/custom-type/line-item-type-definition';

describe('UnidentifiedCustomerMiddleware', () => {
  let middleware: UnidentifiedCustomerMiddleware;
  let configService: ConfigService;
  let cartErrorService: CartErrorService;
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: jest.Mock;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UnidentifiedCustomerMiddleware,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: CartErrorService,
          useValue: {
            handleError: jest.fn(),
          },
        },
        {
          provide: BASKET_STORE_SERVICE,
          useValue: {
            save: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
            isEnabled: jest.fn(),
          },
        },
        CartTypeDefinition,
        LineItemTypeDefinition,
        {
          provide: 'TypeDefinitions',
          useFactory: (cartTypeDefinition, lineItemTypeDefinition) => [
            cartTypeDefinition,
            lineItemTypeDefinition,
          ],
          inject: [CartTypeDefinition, LineItemTypeDefinition],
        },
      ],
    }).compile();

    configService = moduleRef.get<ConfigService>(ConfigService);
    middleware = moduleRef.get<UnidentifiedCustomerMiddleware>(
      UnidentifiedCustomerMiddleware,
    );
    cartErrorService = moduleRef.get<CartErrorService>(CartErrorService);
    nextFunction = jest.fn();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should call next function if excludeUnidentifiedCustomers is false', () => {
    jest.spyOn(configService, 'get').mockReturnValue(false);
    mockRequest = {};
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should call next function if excludeUnidentifiedCustomers is false and identityValue and voucherCodes are present', () => {
    jest.spyOn(configService, 'get').mockReturnValue(false);
    mockRequest = {
      body: {
        resource: {
          obj: {
            custom: {
              fields: {
                'eagleeye-identityValue': 'some-identity',
                'eagleeye-voucherCodes': ['some-code'],
              },
            },
            lineItems: [],
          },
        },
      },
    };
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return an array of actions if excludeUnidentifiedCustomers is true and identityValue and vourcherCodes are not present', async () => {
    jest.spyOn(configService, 'get').mockReturnValue(true);
    mockRequest = {
      body: {
        resource: {
          obj: {
            custom: {
              fields: {},
            },
            lineItems: [],
          },
        },
      },
    };
    const returnedActions = {
      actions: [
        {
          action: 'setCustomType',
          type: { typeId: 'type', key: 'custom-cart-type' },
          fields: {
            'eagleeye-errors': [],
            'eagleeye-appliedDiscounts': [],
            'eagleeye-voucherCodes': [],
            'eagleeye-potentialVoucherCodes': [],
            'eagleeye-action': '',
            'eagleeye-settledStatus': '',
            'eagleeye-loyaltyEarnAndCredits': '',
          },
        },
        { action: 'setDirectDiscounts', discounts: [] },
      ],
    };
    jest
      .spyOn(cartErrorService, 'handleError')
      .mockResolvedValueOnce(returnedActions as any);

    await middleware.use(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(returnedActions);
  });

  it('should call next function if excludeUnidentifiedCustomers is true and identityValue and voucherCodes are present', () => {
    jest.spyOn(configService, 'get').mockReturnValue(true);
    mockRequest = {
      body: {
        resource: {
          obj: {
            custom: {
              fields: {
                'eagleeye-identityValue': 'some-identity',
                'eagleeye-voucherCodes': ['some-code'],
              },
            },
            lineItems: [],
          },
        },
      },
    };
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should call next function if excludeUnidentifiedCustomers is true and identityValue is present and voucherCodes is an empty array', () => {
    jest.spyOn(configService, 'get').mockReturnValue(true);
    mockRequest = {
      body: {
        resource: {
          obj: {
            custom: {
              fields: {
                'eagleeye-identityValue': 'some-identity',
                'eagleeye-voucherCodes': [],
              },
            },
            lineItems: [],
          },
        },
      },
    };
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should call next function if excludeUnidentifiedCustomers is true and identityValue is present and voucherCodes is not present', () => {
    jest.spyOn(configService, 'get').mockReturnValue(true);
    mockRequest = {
      body: {
        resource: {
          obj: {
            custom: {
              fields: {
                'eagleeye-identityValue': 'some-identity',
              },
            },
            lineItems: [],
          },
        },
      },
    };
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should call next function if excludeUnidentifiedCustomers is true and identityValue is not present and at least one voucherCode is present', () => {
    jest.spyOn(configService, 'get').mockReturnValue(true);
    mockRequest = {
      body: {
        resource: {
          obj: {
            custom: {
              fields: {
                'eagleeye-voucherCodes': ['some-code'],
              },
            },
            lineItems: [],
          },
        },
      },
    };
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });
});
