import { UnhandledExceptionsFilter } from './unhandled-exception.filter';
import { ArgumentsHost } from '@nestjs/common';
import { CTActionsBuilder } from '../../providers/commercetools/actions/ActionsBuilder';
import { CartCustomTypeActionBuilder } from '../../providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import { Response } from 'express';

describe('UnhandledExceptionsFilter', () => {
  let filter: UnhandledExceptionsFilter;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockResponse: jest.Mocked<Response>;

  beforeEach(() => {
    filter = new UnhandledExceptionsFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      } as unknown as ArgumentsHost),
    } as any;
  });

  it('should log the error', () => {
    const loggerSpy = jest.spyOn(filter['logger'], 'error');
    const error = new Error('Test error');

    filter.catch(error, mockArgumentsHost);

    expect(loggerSpy).toHaveBeenCalledWith('Unhandled error: ', error);
  });

  it('should return a 200 status', () => {
    const error = new Error('Test error');

    filter.catch(error, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it('should return a custom error message', () => {
    const error = new Error('Test error');
    const expectedActions = new CTActionsBuilder().add(
      CartCustomTypeActionBuilder.addCustomType({
        errors: [
          {
            type: 'EE_PLUGIN_GENERIC_ERROR',
            message: 'An unexpected error occured in the eagle eye plugin',
          },
        ],
      }),
    );
    filter.catch(error, mockArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(expectedActions.build());
  });
});
