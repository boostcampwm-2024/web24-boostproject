import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { StudyRoomsService } from '../study-room/study-room.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class SignalingServerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly studyRoomsService: StudyRoomsService,
  ) {}

  @WebSocketServer()
  server: Server;

  // 1. 신규 참가자가 접속을 요청한다. 그리고 방에 있는 기존 참가자들 소켓 정보를 반환한다.
  async handleConnection(client: Socket) {
    this.logger.info(`${client.id} 접속!!!`);
    const defaultRoom = '1';

    // 방에 사용자 추가
    await this.studyRoomsService.addUserToRoom(defaultRoom, client.id);

    // 기존 사용자 정보 가져오기
    const users = (await this.studyRoomsService.getRoomUsers(defaultRoom)).filter(
      (id) => id.socketId !== client.id,
    );

    // 기존 사용자 목록 전송
    client.emit('offerRequest', { users });
  }

  async handleDisconnect(client: Socket) {
    const defaultRoom = '1';
    this.logger.info(`${client.id} 접속해제!!!`);
    this.studyRoomsService.leaveAllRooms(client.id);
    const users = await this.studyRoomsService.getRoomUsers(defaultRoom);
    for (const userId of users) {
      this.server
        .to(userId.socketId)
        .emit('userDisconnected', JSON.stringify({ targetId: client.id }));
    }
  }

  // 2. 신규 참가자가 기존 참가자들에게 offer를 보낸다.
  @SubscribeMessage('sendOffer')
  handleSendOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody('offer') offer: RTCSessionDescriptionInit,
    @MessageBody('oldId') oldId: string,
    @MessageBody('newRandomId') newRandomId: string,
  ) {
    this.logger.silly(
      `new user: ${client.id}(${newRandomId}) sends an offer to old user: ${oldId}`,
    );
    this.server
      .to(oldId)
      .emit('answerRequest', JSON.stringify({ newId: client.id, offer, newRandomId }));
  }

  // 3. 기존 참가자들은 신규 참가자에게 answer를 보낸다.
  @SubscribeMessage('sendAnswer')
  handleSendAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody('answer') answer: RTCSessionDescriptionInit,
    @MessageBody('newId') newId: string,
    @MessageBody('oldRandomId') oldRandomId: string,
  ) {
    this.logger.silly(
      `old user: ${client.id}(${oldRandomId}) sends an answer to new user: ${newId}`,
    );
    this.server.to(newId).emit('completeConnection', {
      oldId: client.id,
      answer,
      oldRandomId,
    });
  }

  @SubscribeMessage('sendIceCandidate')
  handleSendIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody('targetId') targetId: string,
    @MessageBody('iceCandidate') candidate: RTCIceCandidateInit,
  ) {
    this.logger.silly(`user: ${client.id} sends ICE candidate to user: ${targetId}`);
    this.server
      .to(targetId)
      .emit('setIceCandidate', JSON.stringify({ senderId: client.id, iceCandidate: candidate }));
  }
}
