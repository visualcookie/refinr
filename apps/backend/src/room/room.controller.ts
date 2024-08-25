import { Body, Controller, Post } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post('create')
  createRoom(@Body('name') name: string): { roomId: string } {
    const roomId = this.roomService.createRoom(name);
    return { roomId };
  }
}
