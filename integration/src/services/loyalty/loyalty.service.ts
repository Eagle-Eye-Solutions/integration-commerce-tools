import { Injectable } from '@nestjs/common';

@Injectable()
export class LoyaltyService {
  constructor() {}

  async getEarnAndCredits(): Promise<any> {
    return {
      earn: 0,
    };
  }
}
