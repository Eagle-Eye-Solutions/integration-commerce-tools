import { Provider } from '@nestjs/common';
import { Wallet } from '../eagleeye/eagleeye.provider';

export const BREAKABLE_API = Symbol('BREAKABLE_API');
export const EagleEyeApiCircuitBreakerProvider: Provider = {
  provide: BREAKABLE_API,
  useClass: Wallet,
};
