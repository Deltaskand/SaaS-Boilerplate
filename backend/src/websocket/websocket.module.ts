import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';

/**
 * WebSocket Module
 * Provides real-time communication capabilities
 */
@Module({
  providers: [AppGateway],
  exports: [AppGateway],
})
export class WebSocketModule {}
