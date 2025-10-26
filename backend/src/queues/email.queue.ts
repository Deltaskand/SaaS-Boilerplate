import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

/**
 * Email Queue Service
 * Manages email jobs for asynchronous processing
 */
@Injectable()
export class EmailQueue {
  private readonly logger = new Logger(EmailQueue.name);

  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(userId: string, email: string, name: string): Promise<void> {
    try {
      await this.emailQueue.add(
        'welcome',
        { userId, email, name },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
        },
      );
      this.logger.log(`Welcome email queued for ${email}`);
    } catch (error) {
      this.logger.error(`Failed to queue welcome email for ${email}`, error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      await this.emailQueue.add(
        'password-reset',
        { email, token },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
        },
      );
      this.logger.log(`Password reset email queued for ${email}`);
    } catch (error) {
      this.logger.error(`Failed to queue password reset email for ${email}`, error);
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string, token: string): Promise<void> {
    try {
      await this.emailQueue.add(
        'email-verification',
        { email, token },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
        },
      );
      this.logger.log(`Email verification queued for ${email}`);
    } catch (error) {
      this.logger.error(`Failed to queue email verification for ${email}`, error);
    }
  }
}
