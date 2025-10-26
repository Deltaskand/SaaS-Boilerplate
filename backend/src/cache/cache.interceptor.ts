import { Injectable, ExecutionContext, CallHandler, NestInterceptor, Inject } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Custom Cache Interceptor
 * Restricts caching to idempotent requests and honours Cache-Control directives.
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private static readonly DEFAULT_TTL_SECONDS = 300;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();
    const method = (request.method as string | undefined)?.toUpperCase();

    if (!method || !['GET', 'HEAD'].includes(method)) {
      return next.handle();
    }

    const requestCacheControl = request.headers['cache-control'] as string | undefined;
    if (requestCacheControl && this.shouldBypassCache(requestCacheControl)) {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request);

    const cachedResponse = await this.cacheManager.get(cacheKey);
    if (cachedResponse) {
      return of(cachedResponse);
    }

    return next.handle().pipe(
      tap(async (body) => {
        const headerValue = this.extractCacheControl(response);

        if (headerValue && this.shouldBypassCache(headerValue)) {
          return;
        }

        const ttl = this.resolveTtl(headerValue);

        await this.cacheManager.set(cacheKey, body, ttl ? { ttl } : undefined);

        if (ttl && response?.setHeader) {
          response.setHeader('Cache-Control', `public, max-age=${ttl}`);
        }
      }),
    );
  }

  private generateCacheKey(request: any): string {
    const { url, method, query, params } = request;
    return `cache:${method}:${url}:${JSON.stringify(query)}:${JSON.stringify(params)}`;
  }

  private shouldBypassCache(cacheControl: string): boolean {
    const directives = cacheControl.toLowerCase();
    return directives.includes('no-store') || directives.includes('no-cache');
  }

  private resolveTtl(cacheControl?: string): number | undefined {
    if (!cacheControl) {
      return HttpCacheInterceptor.DEFAULT_TTL_SECONDS;
    }

    const match = cacheControl.toLowerCase().match(/max-age=(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    if (this.shouldBypassCache(cacheControl)) {
      return undefined;
    }

    return HttpCacheInterceptor.DEFAULT_TTL_SECONDS;
  }

  private extractCacheControl(response: any): string | undefined {
    if (!response) {
      return undefined;
    }

    const directHeader = response.getHeader?.('Cache-Control') ?? response.getHeader?.('cache-control');
    if (typeof directHeader === 'string') {
      return directHeader;
    }

    const headers = response.getHeaders?.();
    if (headers) {
      const header = headers['cache-control'] ?? headers['Cache-Control'];
      if (typeof header === 'string') {
        return header;
      }
    }

    return undefined;
  }
}
