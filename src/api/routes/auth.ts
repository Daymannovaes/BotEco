import { Router, Request, Response } from 'express';
import { createUser, findUserByEmail, verifyPassword, toPublicUser } from '../../db/models/user.js';
import { generateAccessToken, generateRefreshToken, verifyToken, AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
      return;
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Formato de e-mail inválido' });
      return;
    }

    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres' });
      return;
    }

    // Check if user exists
    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'E-mail já cadastrado' });
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
    res.status(500).json({ error: 'Falha no cadastro' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'E-mail ou senha inválidos' });
      return;
    }

    const valid = await verifyPassword(user, password);
    if (!valid) {
      res.status(401).json({ error: 'E-mail ou senha inválidos' });
      return;
    }

    if (user.is_disabled) {
      res.status(403).json({ error: 'Conta desativada' });
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
    res.status(500).json({ error: 'Falha no login' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Token de atualização é obrigatório' });
      return;
    }

    const payload = verifyToken(refreshToken);
    if (!payload) {
      res.status(401).json({ error: 'Token inválido ou expirado' });
      return;
    }

    const user = await findUserByEmail(payload.email);
    if (!user || user.is_disabled) {
      res.status(401).json({ error: 'Usuário não encontrado ou desativado' });
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
    res.status(500).json({ error: 'Falha ao atualizar token' });
  }
});

// GET /auth/me - Get current user (requires auth)
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  res.json({ user: toPublicUser(req.user) });
});

export default router;
