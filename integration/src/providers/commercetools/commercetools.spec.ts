import { Test, TestingModule } from '@nestjs/testing';
import { Commercetools } from './commercetools';

describe('Commercetools', () => {
  let provider: Commercetools;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Commercetools],
    }).compile();

    provider = module.get<Commercetools>(Commercetools);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
