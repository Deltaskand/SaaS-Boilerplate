import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '../config/config.service';

/**
 * Database Module
 * Configures MongoDB connection using Mongoose
 */
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        return {
          uri: configService.mongodbUri,
          retryAttempts: 3,
          retryDelay: 1000,
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              logger.log('MongoDB connected successfully');
            });
            connection.on('disconnected', () => {
              logger.warn('MongoDB disconnected');
            });
            connection.on('error', (error: Error) => {
              logger.error('MongoDB connection error:', error.message);
            });
            return connection;
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
