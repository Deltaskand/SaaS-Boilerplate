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
  namespace: '/ws',
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AppGateway.name);

  constructor(private readonly configService: ConfigService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    const corsOrigin = this.configService.websocketCorsOrigin;
    const allowedOrigins = Array.isArray(corsOrigin)
      ? corsOrigin.filter(Boolean)
      : corsOrigin
      ? [corsOrigin]
      : [];

    server.engine.opts = server.engine.opts || {};
    server.engine.opts.cors = server.engine.opts.cors || {};
    server.engine.opts.cors.origin = corsOrigin;
    server.engine.opts.cors.credentials = true;

    this.server.opts = this.server.opts || {};
    this.server.opts.cors = this.server.opts.cors || {};
    this.server.opts.cors.origin = corsOrigin;
    this.server.opts.cors.credentials = true;

    if (corsOrigin !== '*' && allowedOrigins.length > 0) {
      server.use((socket, next) => {
        const origin = socket.handshake.headers.origin as string | undefined;
        if (origin && !allowedOrigins.includes(origin)) {
          this.logger.warn(`Rejected WebSocket connection from origin ${origin}`);
          return next(new Error('Origin not allowed'));
        }
        return next();
      });
    }

    this.logger.log(
      `WebSocket CORS origin: ${Array.isArray(corsOrigin) ? allowedOrigins.join(', ') : corsOrigin}`,
    );
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
  handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    this.logger.debug(`Message from ${client.id}:`, data);
    client.emit('message', {
      echo: data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastMessage(event: string, data: any): void {
    this.server.emit(event, data);
    this.logger.debug(`Broadcast: ${event}`, data);
  }

  sendToClient(clientId: string, event: string, data: any): void {
    this.server.to(clientId).emit(event, data);
    this.logger.debug(`Message to ${clientId}: ${event}`, data);
  }
}
