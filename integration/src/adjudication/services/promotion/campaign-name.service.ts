import { DiscountDescription } from '../../../common/providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import { Injectable } from '@nestjs/common';
import { removeDuplicatesFromMapValues } from '../../../common/helper/deduplicateUtil';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CampaignNameService {
  constructor(private readonly configService: ConfigService) {}

  getBasketCampaignNames(walletOpenResponse: any): DiscountDescription[] {
    const basketCampaingNames = [];
    basketCampaingNames.push(
      ...this.getOrderTotalCampaignNames(walletOpenResponse),
    );

    basketCampaingNames.push(
      ...this.getShippingCampaignNames(walletOpenResponse),
    );
    return basketCampaingNames?.map((name) => ({
      description: name,
    }));
  }

  private getOrderTotalCampaignNames(walletOpenResponse: any) {
    const resourceIds =
      walletOpenResponse.data?.analyseBasketResults?.basket?.summary?.adjustmentResults?.map(
        (result) => result.resourceId,
      );
    if (resourceIds?.length) {
      return walletOpenResponse.data?.analyseBasketResults?.discount
        ?.filter((discount) => resourceIds.includes(discount.campaignId))
        .map((discount) => discount.campaignName);
    }
    return [];
  }

  private getShippingCampaignNames(walletOpenResponse) {
    const shippingMethodMap = this.configService.get(
      'eagleEye.shippingMethodMap',
    );
    const shippingIds = shippingMethodMap?.map((method) => method.upc);
    const resourceIdToShippingMaps = new Map<string, string>();
    walletOpenResponse.data?.analyseBasketResults?.basket?.contents
      ?.filter((content) => shippingIds.includes(content.upc || content.sku))
      ?.forEach((content) => {
        content.adjustmentResults
          ?.filter((result) => result.resourceId !== undefined)
          ?.forEach((adjustmentResult) => {
            resourceIdToShippingMaps.set(
              adjustmentResult.resourceId,
              content.upc || content.sku,
            );
          });
      });
    const shippingCampaignNames = [];
    if (resourceIdToShippingMaps.size) {
      walletOpenResponse.data?.analyseBasketResults?.discount?.forEach(
        (discount) => {
          if (resourceIdToShippingMaps.has(discount.campaignId)) {
            shippingCampaignNames.push(discount.campaignName);
          }
        },
      );
    }
    return shippingCampaignNames;
  }

  getLineItemsCampaignNames(walletOpenResponse: any): Map<string, string[]> {
    const productIdToCampaignNamesMap: Map<string, string[]> = new Map();

    const resourceIdToProductIdMaps = new Map<string, string>();
    walletOpenResponse.data?.analyseBasketResults?.basket?.contents?.forEach(
      (content) => {
        content.adjustmentResults
          ?.filter((result) => result.resourceId !== undefined)
          ?.forEach((adjustmentResult) => {
            resourceIdToProductIdMaps.set(
              adjustmentResult.resourceId,
              content.upc || content.sku,
            );
          });
      },
    );

    if (resourceIdToProductIdMaps.size) {
      walletOpenResponse.data?.analyseBasketResults?.discount?.forEach(
        (discount) => {
          if (resourceIdToProductIdMaps.has(discount.campaignId)) {
            if (
              productIdToCampaignNamesMap.has(
                resourceIdToProductIdMaps.get(discount.campaignId),
              )
            ) {
              productIdToCampaignNamesMap.set(
                resourceIdToProductIdMaps.get(discount.campaignId),
                [
                  ...productIdToCampaignNamesMap.get(
                    resourceIdToProductIdMaps.get(discount.campaignId),
                  ),
                  discount.campaignName,
                ],
              );
            } else {
              productIdToCampaignNamesMap.set(
                resourceIdToProductIdMaps.get(discount.campaignId),
                [discount.campaignName],
              );
            }
          }
        },
      );
    }
    return removeDuplicatesFromMapValues(productIdToCampaignNamesMap);
  }
}
