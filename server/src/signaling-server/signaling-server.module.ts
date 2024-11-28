import { Module } from '@nestjs/common';
import { SignalingServerGateway } from './signaling-server.gateway';
import { StudyRoomModule } from '../study-room/study-room.module';
import { ChattingService } from 'src/chatting-server/chatting-server.service';

@Module({
  imports: [StudyRoomModule],
  providers: [SignalingServerGateway, ChattingService],
})
export class SignalingServerModule {}
