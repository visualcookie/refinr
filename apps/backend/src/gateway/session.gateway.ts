import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface User {
  clientId: string;
  name: string;
  isModerator?: boolean;
}

interface RoomData {
  users: User[];
  moderatorId?: string;
  votingPhase: 'ended' | 'voting' | 'results';
  votes: Record<string, string>;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Update this for security purposes in production
  },
})
export class SessionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private roomData: Record<string, RoomData> = {};

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    for (const roomId in this.roomData) {
      const userIndex = this.roomData[roomId].users.findIndex(
        (user) => user.clientId === client.id,
      );

      if (userIndex !== -1) {
        // Remove the user from the room's user list
        this.roomData[roomId].users.splice(userIndex, 1);

        // Emit the updated user list to the remaining clients in the room
        this.server.to(roomId).emit('roomUsers', this.roomData[roomId].users);

        // Remove the room data if there are no users left
        if (this.roomData[roomId].users.length === 0) {
          delete this.roomData[roomId];
        }

        break;
      }
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; name: string },
  ): void {
    const { roomId, name } = data;

    client.join(roomId);
    if (!this.roomData[roomId]) {
      this.roomData[roomId] = {
        users: [],
        moderatorId: client.id,
        votingPhase: 'ended',
        votes: {},
      };
    }

    this.roomData[roomId].users.push({ name, clientId: client.id });

    this.server.to(roomId).emit('moderator', this.roomData[roomId].moderatorId);
    this.server.to(roomId).emit('votingResults', this.roomData[roomId].votes);
    this.server
      .to(roomId)
      .emit('votingPhase', this.roomData[roomId].votingPhase);
    this.server.to(roomId).emit('roomUsers', this.roomData[roomId].users);
  }

  @SubscribeMessage('startVoting')
  handleStartVoting(@MessageBody() roomId: string): void {
    const room = this.roomData[roomId];

    if (!room) {
      console.error(`Room with ID ${roomId} not found.`);
      return;
    }

    room.votingPhase = 'voting';
    room.votes = {};
    this.server.to(roomId).emit('votingPhase', room.votingPhase);
    this.server.to(roomId).emit('resetVotes', room.votes);
  }

  @SubscribeMessage('giveVote')
  handleVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() { roomId, vote }: { roomId: string; vote: string },
  ): void {
    const room = this.roomData[roomId];

    if (!room) {
      console.error(`Room with ID ${roomId} not found.`);
      return;
    }

    if (room.votingPhase !== 'voting') {
      console.error(`Voting is not active in room with ID ${roomId}.`);
      return;
    }

    room.votes[client.id] = vote;
    this.server.to(roomId).emit('voteReceived', room.votes);
  }

  @SubscribeMessage('endVoting')
  handleEndVoting(@MessageBody() roomId: string): void {
    const room = this.roomData[roomId];

    if (!room) {
      console.error(`Room with ID ${roomId} not found.`);
      return;
    }

    room.votingPhase = 'results';
    this.server.to(roomId).emit('votingPhase', room.votingPhase);
    this.server.to(roomId).emit('votingResults', room.votes);
  }

  @SubscribeMessage('resetVoting')
  handleResetVoting(@MessageBody() roomId: string): void {
    const room = this.roomData[roomId];

    if (!room) {
      console.error(`Room with ID ${roomId} not found.`);
      return;
    }

    room.votingPhase = 'ended';
    room.votes = {};
    this.server.to(roomId).emit('votingPhase', room.votingPhase);
    this.server.to(roomId).emit('resetVotes', room.votes);
  }
}
