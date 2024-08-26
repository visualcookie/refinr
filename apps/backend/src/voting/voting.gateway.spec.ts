import { Test, TestingModule } from '@nestjs/testing';
import { VotingGateway } from './voting.gateway';

describe('VotingGateway', () => {
  let gateway: VotingGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VotingGateway],
    }).compile();

    gateway = module.get<VotingGateway>(VotingGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
