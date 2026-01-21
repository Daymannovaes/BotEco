import express, { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import healthRoutes from './routes/health.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  if (origin && config.api.corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/health', healthRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API] Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export function startApiServer(): Promise<void> {
  return new Promise((resolve) => {
    app.listen(config.api.port, () => {
      console.log(`[API] Server listening on port ${config.api.port}`);
      resolve();
    });
  });
}

export { app };
