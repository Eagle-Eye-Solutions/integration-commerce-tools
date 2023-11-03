import { Test, TestingModule } from '@nestjs/testing';
import { Eagleeye } from './eagleeye';

describe('Eagleeye', () => {
  let provider: Eagleeye;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Eagleeye],
    }).compile();

    provider = module.get<Eagleeye>(Eagleeye);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
