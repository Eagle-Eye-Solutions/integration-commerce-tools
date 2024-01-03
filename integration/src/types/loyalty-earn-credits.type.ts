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
};

export type LoyaltyTotalObject = {
  total: number;
};

export type LoyaltyBreakdownObject = LoyaltyTotalObject & {
  offers: LoyaltyOfferBreakdown[];
};
