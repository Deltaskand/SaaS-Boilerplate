import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '../config/config.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AppGateway.name);

  constructor(private readonly configService: ConfigService) {}

  afterInit(_server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    const corsOrigin = this.configService.websocketCorsOrigin;
    this.logger.log(`WebSocket CORS origin: ${corsOrigin}`);
  }

  handleConnection(client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client connected: ${clientId}`);
    client.emit('connected', {
      message: 'Connected to SaaS Boilerplate WebSocket',
      clientId,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client disconnected: ${clientId}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: unknown, @ConnectedSocket() client: Socket): void {
    this.logger.debug(`Message from ${client.id}:`, data);
    client.emit('message', {
      echo: data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastMessage(event: string, data: unknown): void {
    this.server.emit(event, data);
    this.logger.debug(`Broadcast: ${event}`, data);
  }

  sendToClient(clientId: string, event: string, data: unknown): void {
    this.server.to(clientId).emit(event, data);
    this.logger.debug(`Message to ${clientId}: ${event}`, data);
  }
}
