import { Test, TestingModule } from '@nestjs/testing';
import { CtBasketStoreService } from './ct-basket-store.service';
import { CustomObjectService } from '../../providers/commercetools/custom-object/custom-object.service';
import { CUSTOM_OBJECT_CONTAINER_BASKET_STORE } from '../../constants/constants';
import { EagleEyePluginException } from '../../exceptions/eagle-eye-plugin.exception';
import { ConfigService } from '@nestjs/config';

describe('CtBasketStoreService', () => {
  let service: CtBasketStoreService;
  let customObjectService: CustomObjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CtBasketStoreService,
        {
          provide: CustomObjectService,
          useValue: {
            saveCustomObject: jest.fn(),
            deleteCustomObject: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CtBasketStoreService>(CtBasketStoreService);
    customObjectService = module.get<CustomObjectService>(CustomObjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('save', () => {
    it('should save the basket and return the location', async () => {
      const eeBasket = {};
      const ctCartId = 'cartId';
      const saveCustomObjectResponse = {
        body: {
          key: 'key',
          id: 'id',
          version: 1,
          createdAt: '2023-11-29T10:31:49.466Z',
          lastModifiedAt: '2023-11-29T10:31:49.466Z',
          container: 'container',
          value: {},
        },
        statusCode: 200,
        message: 'OK',
        headers: {},
      };

      jest
        .spyOn(customObjectService, 'saveCustomObject')
        .mockResolvedValue(saveCustomObjectResponse);

      const result = await service.save(eeBasket, ctCartId);

      expect(customObjectService.saveCustomObject).toHaveBeenCalledWith(
        ctCartId,
        CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
        {
          enrichedBasket: eeBasket,
          cart: { typeId: 'cart', id: ctCartId },
        },
      );
      expect(result).toEqual({
        storeType: 'CUSTOM_TYPE',
        uri: `custom-objects/${CUSTOM_OBJECT_CONTAINER_BASKET_STORE}/${saveCustomObjectResponse.body.key}`,
      });
    });

    it('should throw an error when saving the basket fails', async () => {
      const eeBasket = {};
      const ctCartId = 'cartId';

      jest
        .spyOn(customObjectService, 'saveCustomObject')
        .mockRejectedValue(new Error());

      await expect(service.save(eeBasket, ctCartId)).rejects.toThrow(
        EagleEyePluginException,
      );
    });
  });

  describe('delete', () => {
    it('should delete the basket', async () => {
      const ctCartId = 'cartId';

      jest
        .spyOn(customObjectService, 'deleteCustomObject')
        .mockResolvedValue(undefined);

      await service.delete(ctCartId);

      expect(customObjectService.deleteCustomObject).toHaveBeenCalledWith(
        CUSTOM_OBJECT_CONTAINER_BASKET_STORE,
        ctCartId,
      );
    });

    it('should throw an error when deleting the basket fails', async () => {
      const ctCartId = 'cartId';

      jest
        .spyOn(customObjectService, 'deleteCustomObject')
        .mockRejectedValue(new Error());

      await expect(service.delete(ctCartId)).rejects.toThrow(
        EagleEyePluginException,
      );
    });
  });
});
