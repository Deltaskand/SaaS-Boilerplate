import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware de correlation ID
 * Ajoute un ID unique à chaque requête pour le traçage distribué
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Récupérer l'ID depuis le header ou en générer un nouveau
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

    // Stocker dans la requête
    req['correlationId'] = correlationId;

    // Ajouter dans la réponse
    res.setHeader('X-Correlation-Id', correlationId);

    next();
  }
}

/**
 * Extension de l'interface Request pour TypeScript
 */
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      userId?: string;
    }
  }
}
