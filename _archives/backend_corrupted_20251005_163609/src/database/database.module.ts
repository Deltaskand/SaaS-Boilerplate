import { Module } from '@nestjs/common';
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
      useFactory: (configService: ConfigService) => ({
        uri: configService.mongodbUri,
        retryAttempts: 3,
        retryDelay: 1000,
        connectionFactory: (connection) => {
          connection.on('connected', () => {
            console.log('MongoDB connected successfully');
          });
          connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
          });
          connection.on('error', (error: Error) => {
            console.error('MongoDB connection error:', error);
          });
          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
