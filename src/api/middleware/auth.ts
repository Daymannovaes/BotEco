import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config.js';
import { findUserById, User } from '../../db/models/user.js';

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}

export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    config.jwt.secret,
    { expiresIn: config.jwt.accessTokenExpiry as jwt.SignOptions['expiresIn'] }
  );
}

export function generateRefreshToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshTokenExpiry as jwt.SignOptions['expiresIn'] }
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const user = await findUserById(payload.userId);

  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  if (user.is_disabled) {
    res.status(403).json({ error: 'Account is disabled' });
    return;
  }

  req.user = user;
  req.userId = user.id;
  next();
}
