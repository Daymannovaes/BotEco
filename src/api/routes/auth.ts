import { Router, Request, Response } from 'express';
import { createUser, findUserByEmail, verifyPassword, toPublicUser } from '../../db/models/user.js';
import { generateAccessToken, generateRefreshToken, verifyToken, AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if user exists
    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const user = await createUser({ email, password });

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    res.status(201).json({
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await verifyPassword(user, password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.is_disabled) {
      res.status(403).json({ error: 'Account is disabled' });
      return;
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    res.json({
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const payload = verifyToken(refreshToken);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    const user = await findUserByEmail(payload.email);
    if (!user || user.is_disabled) {
      res.status(401).json({ error: 'User not found or disabled' });
      return;
    }

    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id, user.email);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error('[Auth] Refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// GET /auth/me - Get current user (requires auth)
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  res.json({ user: toPublicUser(req.user) });
});

export default router;
