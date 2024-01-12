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
  transactionCount?: number;
  totalTransactionCount?: number;
  totalSpend?: number;
  totalTransactionSpend?: number;
  totalUnits?: number;
  totalTransactionUnits?: number;
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
