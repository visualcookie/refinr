import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface User {
  clientId: string;
  name: string;
}

interface RoomData {
  users: User[];
  moderatorId: string;
  votingPhase: 'ended' | 'voting' | 'results';
  votes: Record<string, string>;
}

@WebSocketGateway({
  cors: {
    origin: '*', // TODO: Change later to only allow specific origins
  },
})
export class VotingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(VotingGateway.name);

  // TODO: Use redis to store room data
  private roomData: Map<string, RoomData> = new Map();

  @WebSocketServer() server: Server;

  afterInit() {
    this.logger.log(`Initialized websocket`);
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client id: ${client.id} connected`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client id: ${client.id} disconnected`);
    const roomData = this.roomData;

    for (const roomId in roomData) {
      const userIndex = roomData[roomId].users.findIndex(
        (user) => user.clientId === client.id,
      );

      if (userIndex !== -1) {
        // Remove user from room
        roomData[roomId].users.splice(userIndex, 1);
        this.server.to(roomId).emit('userLeft', this.roomData[roomId].users);

        // Remove room if no users left
        if (this.roomData[roomId].users.length === 0) {
          this.logger.debug(`No users left in room: ${roomId} deleting room`);
          delete this.roomData[roomId];
          this.logger.debug(`New room list: ${JSON.stringify(this.roomData)}`);
        }

        break;
      }
    }
  }

  @SubscribeMessage('joinRoom')
  createRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; user: string },
  ): void {
    const { roomId, user } = data;
    const roomData = this.roomData;

    client.join(roomId);

    // Create new room if it doesn't exist
    if (!roomData[roomId]) {
      roomData[roomId] = {
        users: [],
        moderatorId: client.id,
        votingPhase: 'ended',
        votes: {},
      };
    }

    this.logger.debug(`Room created: ${JSON.stringify(roomData[roomId])}`);
    this.server.to(roomId).emit('roomCreated', roomData[roomId]);

    // Add user to existing room and send updated roomData to all clients in the room
    roomData[roomId].users.push({ clientId: client.id, name: user });
    this.logger.debug(`User joined room: ${JSON.stringify(roomData[roomId])}`);
    this.server.to(roomId).emit('userJoined', roomData[roomId]);
  }

  @SubscribeMessage('changeVotingPhase')
  changeVotingPhase(
    @MessageBody()
    data: {
      roomId: string;
      votingPhase: Pick<RoomData, 'votingPhase'>;
    },
  ): void {
    const { roomId, votingPhase } = data;
    const roomData = this.roomData[roomId];

    if (roomData) {
      roomData.votingPhase = votingPhase;
      this.logger.debug(`Voting phase changed to ${roomData.votingPhase}`);
      this.server.to(roomId).emit('changedVotingPhase', roomData);
    }
  }

  @SubscribeMessage('resetVotes')
  resetVotes(@MessageBody() data: { roomId: string }): void {
    const { roomId } = data;
    const roomData = this.roomData[roomId];

    if (roomData) {
      roomData.votes = {};
      this.logger.debug(`Votes reset`);
      this.server.to(roomId).emit('resetVotes', roomData);
    }
  }

  @SubscribeMessage('vote')
  vote(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; vote: string },
  ): void {
    const { roomId, vote } = data;
    const roomData = this.roomData[roomId];

    if (roomData) {
      roomData.votes[client.id] = vote;
      this.logger.debug(`${client.id} voted for ${vote}`);
      this.server.to(roomId).emit('userVoted', roomData.votes);
    }
  }
}
