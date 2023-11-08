import { Test, TestingModule } from '@nestjs/testing';
import { EagleEye } from './eagleeye.provider';

describe('Eagleeye', () => {
  let provider: EagleEye;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EagleEye],
    }).compile();

    provider = module.get<EagleEye>(EagleEye);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
