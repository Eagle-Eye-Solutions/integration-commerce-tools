import { DiscountDescription } from '../../../common/providers/commercetools/actions/cart-update/CartCustomTypeActionBuilder';
import { Injectable } from '@nestjs/common';
import {
  removeDuplicates,
  removeDuplicatesFromMap,
} from '../../../common/helper/deduplicateUtil';

@Injectable()
export class CampaignNameService {
  getBasketCampaignNames(walletOpenResponse: any): DiscountDescription[] {
    const resourceIds =
      walletOpenResponse.data?.analyseBasketResults?.basket?.summary?.adjustmentResults?.map(
        (result) => result.resourceId,
      );
    if (resourceIds?.length) {
      const basketTotalCampaignNames =
        walletOpenResponse.data?.analyseBasketResults?.discount
          ?.filter((discount) => resourceIds.includes(discount.campaignId))
          .map((discount) => discount.campaignName);
      const deduplicatedBasketCampaigns = removeDuplicates(
        basketTotalCampaignNames,
      );
      return deduplicatedBasketCampaigns?.map((name) => ({
        description: name,
      }));
    }
    return [];
  }

  getLineItemsCampaignNames(walletOpenResponse: any): Map<string, string[]> {
    const productIdToCampaignNamesMap: Map<string, string[]> = new Map();

    const resourceIdToProductIdMaps = new Map<string, string>();
    walletOpenResponse.data?.analyseBasketResults?.basket?.contents?.forEach(
      (content) => {
        content.adjustmentResults?.forEach((adjustmentResult) => {
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
    return removeDuplicatesFromMap(productIdToCampaignNamesMap);
  }
}
