import { Module } from '@nestjs/common';
import { RoomController } from './room/room.controller';
import { RoomService } from './room/room.service';
import { VotingGateway } from './voting/voting.gateway';

@Module({
  imports: [],
  controllers: [RoomController],
  providers: [RoomService, VotingGateway],
})
export class AppModule {}
