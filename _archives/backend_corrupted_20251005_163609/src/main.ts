import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { createPinoLogger } from './common/logger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = createPinoLogger(configService);
  app.useLogger(new Logger());

  app.use(
    helmet({
      contentSecurityPolicy: configService.isProduction
        ? undefined
        : {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            },
          },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(compression());

  app.enableCors({
    origin: configService.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    exposedHeaders: ['X-Correlation-ID'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/live', 'health/ready'],
  });

  if (!configService.isProduction) {
    const config = new DocumentBuilder()
      .setTitle('SaaS Boilerplate API')
      .setDescription('REST API documentation for SaaS Boilerplate - Script 1')
      .setVersion('1.0')
      .addTag('Health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.info(
      `Swagger documentation available at http://localhost:${configService.port}/api/docs`,
    );
  }

  const port = configService.port;
  await app.listen(port);

  logger.info(`🚀 Application is running on: http://localhost:${port}`);
  logger.info(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  logger.info(`💓 Health check: http://localhost:${port}/health`);
  logger.info(`🌍 Environment: ${configService.nodeEnv}`);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});
