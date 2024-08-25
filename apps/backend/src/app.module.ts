import { Module } from '@nestjs/common';
import { SessionGateway } from './gateway/session.gateway';
import { RoomController } from './room/room.controller';
import { RoomService } from './room/room.service';

@Module({
  imports: [],
  controllers: [RoomController],
  providers: [SessionGateway, RoomService],
})
export class AppModule {}
