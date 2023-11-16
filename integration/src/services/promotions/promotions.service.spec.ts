import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsService } from './promotions.service';
import { Commercetools } from '../../providers/commercetools/commercetools.provider';
import { EagleEyeApiClient } from '../../providers/eagleeye/eagleeye.provider';
import { ConfigService } from '@nestjs/config';
import { CartToBasketMapper } from '../../common/mappers/cartToBasket.mapper';
import { Logger } from '@nestjs/common';
import { CircuitBreakerService } from '../../providers/circuit-breaker/circuit-breaker.service';

describe('PromotionsService', () => {
  let service: PromotionsService;
  let circuitBreakerService: CircuitBreakerService;
  const walletOpenMock = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        Commercetools,
        {
          provide: EagleEyeApiClient,
          useValue: {
            wallet: {
              invoke: walletOpenMock,
            },
          },
        },
        ConfigService,
        CartToBasketMapper,
        { provide: CircuitBreakerService, useValue: { fire: jest.fn() } },
        Logger,
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
    circuitBreakerService = module.get<CircuitBreakerService>(
      CircuitBreakerService,
    );
  });

  describe('getBasketLevelDiscounts', () => {
    it('should apply basket level discounts and return discount drafts', async () => {
      // Mock the necessary dependencies and their methods
      const cart = {
        id: 'cartId',
        customerEmail: 'test@example.com',
        lineItems: [],
        totalPrice: { centAmount: 100 },
      };
      const cartReference = { id: 'cartId', obj: cart };
      const walletOpenResponse = {
        analyseBasketResults: {
          basket: {
            summary: {
              totalDiscountAmount: {
                promotions: 10,
              },
              adjustmentResults: [],
            },
          },
          discount: [
            {
              campaignName: 'Example Discount',
            },
          ],
        },
      };

      const cbFireMock = jest
        .spyOn(circuitBreakerService, 'fire')
        .mockResolvedValue(walletOpenResponse);

      const result = await service.getBasketLevelDiscounts(
        cartReference as any,
      );

      expect(cbFireMock).toHaveBeenCalled();
      expect(result).toEqual({
        discounts: [
          service.basketMapper.mapAdjustedBasketToCartDirectDiscount(
            walletOpenResponse.analyseBasketResults.basket,
            cart as any,
          ),
        ],
        discountDescriptions:
          service.basketMapper.mapBasketDiscountsToDiscountDescriptions(
            walletOpenResponse.analyseBasketResults.discount,
          ),
      });
    });
  });
});
