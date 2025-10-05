import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '../config/config.service';
import { AppGateway } from './app.gateway';
import { Socket } from 'socket.io';

describe('AppGateway', () => {
  let gateway: AppGateway;
  let mockConfigService: Partial<ConfigService>;
  let mockClient: Partial<Socket>;

  beforeEach(async () => {
    mockConfigService = {
      websocketCorsOrigin: 'http://localhost:3000',
    };

    mockClient = {
      id: 'test-client-id',
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppGateway,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    gateway = module.get<AppGateway>(AppGateway);
    gateway.server = {
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should log initialization', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.afterInit(gateway.server);

      expect(logSpy).toHaveBeenCalledWith('WebSocket Gateway initialized');
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('WebSocket CORS origin: http://localhost:3000'),
      );
    });
  });

  describe('handleConnection', () => {
    it('should handle client connection', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.handleConnection(mockClient as Socket);

      expect(logSpy).toHaveBeenCalledWith('Client connected: test-client-id');
      expect(mockClient.emit).toHaveBeenCalledWith(
        'connected',
        expect.objectContaining({
          message: 'Connected to SaaS Boilerplate WebSocket',
          clientId: 'test-client-id',
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnection', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.handleDisconnect(mockClient as Socket);

      expect(logSpy).toHaveBeenCalledWith('Client disconnected: test-client-id');
    });
  });

  describe('handlePing', () => {
    it('should respond to ping with pong', () => {
      gateway.handlePing(mockClient as Socket);

      expect(mockClient.emit).toHaveBeenCalledWith(
        'pong',
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('handleMessage', () => {
    it('should handle and echo message', () => {
      const data = { test: 'data' };

      gateway.handleMessage(data, mockClient as Socket);

      expect(mockClient.emit).toHaveBeenCalledWith(
        'message',
        expect.objectContaining({
          echo: data,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('broadcastMessage', () => {
    it('should broadcast message to all clients', () => {
      const event = 'test-event';
      const data = { test: 'data' };

      gateway.broadcastMessage(event, data);

      expect(gateway.server.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('sendToClient', () => {
    it('should send message to specific client', () => {
      const clientId = 'test-client-id';
      const event = 'test-event';
      const data = { test: 'data' };
      const mockTo = { emit: jest.fn() };

      gateway.server.to = jest.fn().mockReturnValue(mockTo);

      gateway.sendToClient(clientId, event, data);

      expect(gateway.server.to).toHaveBeenCalledWith(clientId);
      expect(mockTo.emit).toHaveBeenCalledWith(event, data);
    });
  });
});
