import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { User, UserRole } from '../../modules/users/entities/user.entity';

/**
 * Decorator pour récupérer l'utilisateur courant depuis la requête
 * Usage: @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Decorator pour récupérer uniquement l'ID de l'utilisateur courant
 * Usage: @CurrentUserId() userId: string
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
);

/**
 * Decorator pour définir les rôles requis sur un endpoint
 * Usage: @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
 */
export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata('roles', roles);

/**
 * Decorator pour marquer un endpoint comme public (pas besoin d'auth)
 * Usage: @Public()
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): ReturnType<typeof SetMetadata> => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Decorator pour récupérer l'IP de la requête
 * Usage: @IpAddress() ip: string
 */
export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.ip || request.connection.remoteAddress;
  },
);

/**
 * Decorator pour récupérer le correlation ID
 * Usage: @CorrelationId() correlationId: string
 */
export const CorrelationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.correlationId;
  },
);
