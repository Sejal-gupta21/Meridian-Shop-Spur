import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { getDb } from './db/database';
import chatRoutes from './routes/chat.routes';

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: env.corsOrigin,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }),
);

// Parse JSON bodies up to 1 MB (protects against oversized payloads)
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/chat', chatRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// 404 catch-all
// ---------------------------------------------------------------------------
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[global error handler]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
try {
  getDb(); // Runs migrations on first call
  app.listen(env.port, () => {
    console.log(`🚀  Server running at http://localhost:${env.port}`);
    console.log(`    NODE_ENV:  ${env.nodeEnv}`);
    console.log(`    Database:  ${env.databasePath}`);
    console.log(`    CORS:      ${env.corsOrigin}`);
  });
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}
