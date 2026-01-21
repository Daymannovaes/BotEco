import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { sessionManager } from '../../sessions/manager.js';
import { toPublicUser } from '../../db/models/user.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /users/me - Get current user profile
router.get('/me', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  res.json({ user: toPublicUser(req.user) });
});

// GET /users/me/qr - Get or generate QR code for WhatsApp connection
router.get('/me/qr', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    // Check if already connected
    if (sessionManager.isConnected(req.userId)) {
      res.status(400).json({
        error: 'Already connected',
        status: 'connected',
      });
      return;
    }

    // Check if QR code is already available
    const existingQR = sessionManager.getQRCode(req.userId);
    if (existingQR) {
      res.json({
        qrCode: existingQR,
        status: 'qr_ready',
        message: 'Scan this QR code with WhatsApp',
      });
      return;
    }

    // Create new session (will generate QR code)
    const qrData = await sessionManager.createSession(req.userId);

    if (!qrData) {
      // Session restored from saved credentials
      if (sessionManager.isConnected(req.userId)) {
        res.json({
          status: 'connected',
          message: 'Session restored, already connected',
        });
        return;
      }

      res.status(500).json({ error: 'Failed to generate QR code' });
      return;
    }

    res.json({
      qrCode: qrData.qrCode,
      status: 'qr_ready',
      expiresAt: qrData.expiresAt,
      message: 'Scan this QR code with WhatsApp',
    });
  } catch (err) {
    console.error('[Users] QR generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// GET /users/me/status - Get WhatsApp connection status
router.get('/me/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId || !req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const session = sessionManager.getSession(req.userId);

  res.json({
    status: session?.status || req.user.status,
    phoneNumber: session?.phoneNumber || req.user.phone_number,
    whatsappJid: session?.whatsappJid || req.user.whatsapp_jid,
    lastConnected: req.user.last_connected_at,
    reconnectAttempts: session?.reconnectAttempts || req.user.reconnect_attempts,
    usage: {
      dailyCharsUsed: req.user.daily_chars_used,
      dailyCharsLimit: req.user.daily_chars_limit,
      remaining: Math.max(0, req.user.daily_chars_limit - req.user.daily_chars_used),
    },
  });
});

// POST /users/me/disconnect - Disconnect WhatsApp session
router.post('/me/disconnect', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    await sessionManager.disconnectSession(req.userId);
    res.json({ status: 'disconnected', message: 'WhatsApp session disconnected' });
  } catch (err) {
    console.error('[Users] Disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect session' });
  }
});

// POST /users/me/logout - Logout from WhatsApp (requires re-scan)
router.post('/me/logout', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    await sessionManager.logoutSession(req.userId);
    res.json({ status: 'logged_out', message: 'Logged out from WhatsApp. You will need to scan QR code again.' });
  } catch (err) {
    console.error('[Users] Logout error:', err);
    res.status(500).json({ error: 'Failed to logout from WhatsApp' });
  }
});

export default router;
