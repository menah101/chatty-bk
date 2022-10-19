import { Request, Response, NextFunction } from 'express';
import JWT from 'jsonwebtoken';
import { config } from '@root/config';
import { NotAuthorizedError } from './error-handle';
import { AuthPayload } from '@root/features/auth/interfaces/auth.interface';

export class AuthMiddleware {
  public verifyUser(req: Request, _res: Response, next: NextFunction): void {
    if (!req.session?.jwt) {
      throw new NotAuthorizedError(
        'Token is not available. Please logging again'
      );
    }

    try {
      const payload: AuthPayload = JWT.verify(
        req.session?.jwt,
        config.JWT_TOKEN!
      ) as AuthPayload;
      req.currentUser = payload;
    } catch (error) {
      throw new NotAuthorizedError(
        'Token is not available. Please logging again'
      );
    }
    next();
  }

  public checkAuthentication(
    req: Request,
    _res: Response,
    next: NextFunction
  ): void {
    if (!req.currentUser) {
      throw new NotAuthorizedError(
        'Authentication is not required to access this route.'
      );
    }
    next();
  }
}

export const authMiddleware: AuthMiddleware = new AuthMiddleware();
