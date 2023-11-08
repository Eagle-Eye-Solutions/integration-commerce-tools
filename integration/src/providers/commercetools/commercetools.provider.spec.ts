import { Test, TestingModule } from '@nestjs/testing';
import { Commercetools } from './commercetools.provider';
import { ConfigService } from '@nestjs/config';

describe('Commercetools', () => {
  let provider: Commercetools;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Commercetools, ConfigService],
    }).compile();

    provider = module.get<Commercetools>(Commercetools);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
