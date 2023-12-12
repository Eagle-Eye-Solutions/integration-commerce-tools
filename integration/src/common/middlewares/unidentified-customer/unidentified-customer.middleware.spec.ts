import { UnidentifiedCustomerMiddleware } from './unidentified-customer.middleware';

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CTActionsBuilder } from '../../../providers/commercetools/actions/ActionsBuilder';

describe('UnidentifiedCustomerMiddleware', () => {
  let middleware: UnidentifiedCustomerMiddleware;
  let configService: ConfigService;
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
      ],
    }).compile();

    configService = moduleRef.get<ConfigService>(ConfigService);
    middleware = moduleRef.get<UnidentifiedCustomerMiddleware>(
      UnidentifiedCustomerMiddleware,
    );
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
          },
        },
      },
    };
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return an empty array of actions if excludeUnidentifiedCustomers is true and identityValue and vourcherCodes are not present', () => {
    jest.spyOn(configService, 'get').mockReturnValue(true);
    mockRequest = {
      body: {
        resource: {
          obj: {
            custom: {
              fields: {},
            },
          },
        },
      },
    };
    const ctActionsBuilder = new CTActionsBuilder();
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(ctActionsBuilder.build());
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
          },
        },
      },
    };
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });
});
