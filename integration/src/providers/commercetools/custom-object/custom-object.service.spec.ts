import { Test, TestingModule } from '@nestjs/testing';
import { CustomObjectService } from './custom-object.service';
import { Commercetools } from '../commercetools.provider';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { MockLogger } from '../../../../test/utils/mocks/MockLogger';

describe('CustomObjectService', () => {
  let service: CustomObjectService;
  let commercetools: jest.Mocked<Commercetools>;

  beforeEach(async () => {
    const mockCommercetools = {
      getApiRoot: jest.fn().mockReturnThis(),
      customObjects: jest.fn().mockReturnThis(),
      withContainerAndKey: jest.fn().mockReturnThis(),
      post: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomObjectService,
        { provide: WINSTON_MODULE_PROVIDER, useValue: new MockLogger() },
        { provide: Commercetools, useValue: mockCommercetools },
      ],
    }).compile();

    service = module.get<CustomObjectService>(CustomObjectService);
    commercetools = module.get<Commercetools>(
      Commercetools,
    ) as jest.Mocked<Commercetools>;
  });

  it('should save custom object', async () => {
    const key = 'key';
    const container = 'container';
    const value = 'value';
    const version = 1;

    await service.saveCustomObject(key, container, value, version);

    expect(
      commercetools.getApiRoot().customObjects().post({
        body: {
          key,
          container,
          value,
          version,
        },
      }).execute,
    ).toHaveBeenCalled();
  });

  it('should get custom object', async () => {
    const key = 'key';
    const container = 'container';

    await service.getCustomObject(container, key);

    expect(
      commercetools
        .getApiRoot()
        .customObjects()
        .withContainerAndKey({
          container,
          key,
        })
        .get().execute,
    ).toHaveBeenCalled();
  });

  it('should delete custom object', async () => {
    const key = 'key';
    const container = 'container';
    const version = 1;

    await service.deleteCustomObject(container, key, version);

    expect(
      commercetools
        .getApiRoot()
        .customObjects()
        .withContainerAndKey({
          container,
          key,
        })
        .delete().execute,
    ).toHaveBeenCalled();
  });
});
