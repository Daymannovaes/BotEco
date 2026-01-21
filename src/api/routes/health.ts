import { Router, Request, Response } from 'express';
import { checkConnection } from '../../db/client.js';
import { sessionManager } from '../../sessions/manager.js';
import { checkApiKeyValid } from '../../voice/tts.js';

const router = Router();

// GET /health - Basic health check
router.get('/', async (req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// GET /health/ready - Readiness check for Kubernetes
router.get('/ready', async (req: Request, res: Response): Promise<void> => {
  try {
    const dbOk = await checkConnection();

    if (!dbOk) {
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
      });
      return;
    }

    res.json({
      status: 'ready',
      database: 'connected',
      activeSessions: sessionManager.getConnectedCount(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// GET /health/live - Liveness check for Kubernetes
router.get('/live', async (req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'alive',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// GET /health/detailed - Detailed health check (admin only in production)
router.get('/detailed', async (req: Request, res: Response): Promise<void> => {
  try {
    const [dbOk, elevenLabsOk] = await Promise.all([
      checkConnection(),
      checkApiKeyValid(),
    ]);

    const sessions = sessionManager.getAllSessions();
    let connected = 0;
    let disconnected = 0;
    let pending = 0;

    for (const session of sessions.values()) {
      switch (session.status) {
        case 'connected':
          connected++;
          break;
        case 'disconnected':
          disconnected++;
          break;
        default:
          pending++;
      }
    }

    res.json({
      status: dbOk && elevenLabsOk ? 'healthy' : 'degraded',
      components: {
        database: dbOk ? 'connected' : 'disconnected',
        elevenLabs: elevenLabsOk ? 'connected' : 'error',
      },
      sessions: {
        total: sessions.size,
        connected,
        disconnected,
        pending,
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

export default router;
