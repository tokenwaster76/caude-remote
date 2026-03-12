import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function bearerAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).set('WWW-Authenticate', 'Bearer').json({ error: 'Unauthorized' });
    return;
  }
  const token = auth.slice(7);
  if (token !== config.AUTH_TOKEN) {
    res.status(401).set('WWW-Authenticate', 'Bearer error="invalid_token"').json({ error: 'Invalid token' });
    return;
  }
  next();
}
