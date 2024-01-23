export type LoyaltyEarnAndCredits = {
  earn: {
    basket: LoyaltyTotalObject;
  };
  credit: {
    basket: LoyaltyBreakdownObject;
    items?: LoyaltyBreakdownObject;
  };
};

export type LoyaltyOfferBreakdown = {
  amount: number;
  name: string;
  sku?: string;
  timesRedeemed?: number;
  type?: LOYALTY_CREDIT_TYPE;
  category?: LOYALTY_CREDIT_CATEGORY;
  transactionCount?: number;
  totalTransactionCount?: number;
  totalSpend?: number;
  totalTransactionSpend?: number;
  totalUnits?: number;
  totalTransactionUnits?: number;
  totalObjectives?: number;
  totalObjectivesMet?: number;
  currentObjectives?: QuestCampaign[];
  objectivesToMeet?: QuestCampaign[];
};

export type LoyaltyTotalObject = {
  total: number;
};

export type LoyaltyBreakdownObject = LoyaltyTotalObject & {
  offers: LoyaltyOfferBreakdown[];
};

export enum LOYALTY_CREDIT_TYPE {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETING = 'COMPLETING',
}

export enum LOYALTY_CREDIT_CATEGORY {
  QUEST = 'QUEST',
  CONTINUITY = 'CONTINUITY',
}

export type ProcessedCreditOffers = {
  isProcessRedeemResults: boolean;
  offers: any[];
};

export type QuestCampaign = {
  campaignId: string;
  campaignName: string;
};

export type LookupMaps = {
  accountMap: Record<string, any>;
  campaignToAccountMap: Record<string, string>;
  campaignNameMap: Record<string, string>;
};

export interface QuestCreditOffer {
  questAccount: any;
  result: any;
  creditOfferType: LOYALTY_CREDIT_TYPE;
  totalObjectives: number;
  currentObjectives: QuestCampaign[];
  totalObjectivesMet: number;
  objectivesToMeet: QuestCampaign[];
}
