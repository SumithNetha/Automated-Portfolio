import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { connectDatabase } from './db/connection';
import { seedInitialData } from './scripts/seed';
import authRoutes from './routes/auth';
import webhookRoutes from './routes/webhook';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';

export const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed for modern frontend SPA integration
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(cookieParser());

// Capture raw body for GitHub webhook HMAC SHA256 signature verification
app.use(
  express.json({
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as any).rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.env,
    aiProvider: config.ai.provider,
  });
});

// Root Endpoint - Friendly landing for backend that links or redirects to the frontend portfolio
app.get('/', (req: Request, res: Response) => {
  if (req.accepts('html')) {
    // Redirect browser to frontend UI
    res.redirect(config.frontendUrl || 'http://localhost:5173');
    return;
  }
  res.json({
    name: 'AI-Powered Automatic GitHub Portfolio API',
    status: 'online',
    frontendUrl: config.frontendUrl || 'http://localhost:5173',
    endpoints: {
      health: '/api/health',
      publicProjects: '/api/public/entries',
      categories: '/api/public/categories',
      webhook: '/api/webhook/github',
      admin: '/api/admin',
    },
  });
});

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ success: false, error: `API route ${req.originalUrl} not found` });
});

// Central error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: config.isProduction ? 'Internal Server Error' : err.message || 'An error occurred',
  });
});

export async function startServer(): Promise<any> {
  await connectDatabase();
  await seedInitialData();

  const server = app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 Automated GitHub Portfolio Backend Server`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`🛠️ Mode: ${config.env}`);
    console.log(`🧠 AI Provider: ${config.ai.provider} (${config.ai.model})`);
    console.log(`🔒 Admin: ${config.adminEmail}`);
    console.log(`====================================================`);
  });

  return server;
}

// Start if executed directly
if (require.main === module) {
  startServer().catch((err) => {
    console.error('Fatal startup failure:', err);
    process.exit(1);
  });
}
