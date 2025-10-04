import { Query, Resolver } from '@nestjs/graphql';

/**
 * Base GraphQL Resolver
 * Provides health check query for GraphQL endpoint
 */
@Resolver()
export class BaseResolver {
  @Query('health')
  health() {
    return {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
