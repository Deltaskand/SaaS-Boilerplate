import { Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '../config/config.service';
import { Request, Response } from 'express';
import { BaseResolver } from './base.resolver';
import { GraphQLFormattedError } from 'graphql';

@Module({
  imports: [
    NestGraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        typePaths: ['./**/*.graphql'],
        // RETIRÉ : definitions (ne génère plus graphql.schema.ts)
        playground: configService.graphqlPlayground,
        introspection: configService.graphqlIntrospection,
        context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
        formatError: (formattedError: GraphQLFormattedError): GraphQLFormattedError => ({
          message: formattedError.message,
          extensions: {
            code: formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR',
          },
          path: formattedError.path,
        }),
        cors: {
          origin: configService.corsOrigin,
          credentials: true,
        },
      }),
    }),
  ],
  providers: [BaseResolver],
  exports: [],
})
export class GraphQLConfigModule {}
