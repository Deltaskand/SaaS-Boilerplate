import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { EmailQueue } from './email.queue';

describe('EmailQueue', () => {
  let service: EmailQueue;
  let mockQueue: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: '1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailQueue,
        {
          provide: getQueueToken('email'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<EmailQueue>(EmailQueue);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWelcomeEmail', () => {
    it('should queue welcome email', async () => {
      await service.sendWelcomeEmail('user-123', 'test@example.com', 'Test User');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'welcome',
        { userId: 'user-123', email: 'test@example.com', name: 'Test User' },
        expect.objectContaining({
          attempts: 3,
          removeOnComplete: true,
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      mockQueue.add.mockRejectedValue(new Error('Queue error'));
      await expect(service.sendWelcomeEmail('user-123', 'test@example.com', 'Test User')).resolves.not.toThrow();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should queue password reset email', async () => {
      await service.sendPasswordResetEmail('test@example.com', 'reset-token-123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'password-reset',
        { email: 'test@example.com', token: 'reset-token-123' },
        expect.objectContaining({
          attempts: 5,
        }),
      );
    });
  });

  describe('sendEmailVerification', () => {
    it('should queue email verification', async () => {
      await service.sendEmailVerification('test@example.com', 'verify-token-123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'email-verification',
        { email: 'test@example.com', token: 'verify-token-123' },
        expect.objectContaining({
          attempts: 5,
        }),
      );
    });
  });
});
