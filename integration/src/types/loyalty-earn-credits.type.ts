export type LoyaltyEarnAndCredits = {
  earn: {
    basket: LoyaltyBalanceObject;
  };
  credit: {
    basket: LoyaltyBalanceObject;
    items: LoyaltyBalanceObject;
  };
};

export type LoyaltyBalanceObject = {
  balance: number;
  offers: any[];
};
