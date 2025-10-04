import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';

/**
 * Fonction de bootstrap de l'application
 * Configuration de sécurité niveau NASA
 */
async function bootstrap(): Promise<void> {
  // Créer l'application NestJS
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Récupérer les services
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  logger.setContext('Bootstrap');

  // Configuration globale
  const port = configService.get<number>('app.port', 3000);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  const corsOrigins = configService.get<string[]>('security.corsOrigins', []);

  // Utiliser le logger personnalisé
  app.useLogger(logger);

  // Préfixe global pour toutes les routes
  app.setGlobalPrefix(apiPrefix);

  // Versioning de l'API
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Sécurité: Helmet (headers HTTP sécurisés)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Compression des réponses
  app.use(compression());

  // Parser les cookies
  app.use(cookieParser(configService.get<string>('security.cookieSecret')));

  // CORS
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
    exposedHeaders: ['X-Correlation-Id'],
  });

  // Validation globale avec class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les propriétés non définies dans le DTO
      forbidNonWhitelisted: true, // Rejette les requêtes avec des propriétés inconnues
      transform: true, // Transforme automatiquement les types
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: configService.get<string>('app.nodeEnv') === 'production',
    }),
  );

  // Swagger / OpenAPI Documentation
  if (configService.get<string>('app.nodeEnv') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SaaS Boilerplate API')
      .setDescription(
        'Production-grade SaaS Boilerplate with NASA-level robustness\n\n' +
          'Features:\n' +
          '- 🔐 JWT Authentication (Access + Refresh tokens)\n' +
          '- 👤 User Management with RGPD compliance\n' +
          '- 📊 Subscription Plans (Free, Pro, Enterprise)\n' +
          '- 🔒 Argon2id password hashing\n' +
          '- 🛡️ Rate limiting & brute-force protection\n' +
          '- 📝 Structured logging with Pino\n' +
          '- 🏥 Health checks\n' +
          '- 📈 Prometheus metrics\n' +
          '- 🔍 Distributed tracing\n' +
          '- ✅ 80%+ test coverage',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Users', 'User management and GDPR compliance')
      .addTag('Health', 'Application health checks')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'SaaS Boilerplate API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });

    logger.log(`📚 Swagger documentation available at http://localhost:${port}/docs`);
  }

  // Démarrer le serveur
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`🏥 Health check available at: http://localhost:${port}/health`);
  logger.log(`🌍 Environment: ${configService.get<string>('app.nodeEnv')}`);
}

// Lancer l'application
bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});
