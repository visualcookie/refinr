import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomService {
  createRoom(name: string): string {
    return uuidv4(); // Generates a unique room ID
  }
}
