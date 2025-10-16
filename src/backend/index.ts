import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import { workflowRoutes } from './routes/workflows';
import { executionRoutes } from './routes/executions';
import { initializeDatabase } from './models/database';

const app: Express = express();
const PORT = process.env.PORT || 3000;
const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Middleware
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);

// Health endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'n8n-mvp' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Initialize and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized');

    app.listen(PORT, () => {
      console.log(`\n✨ n8n MVP Server Running`);
      console.log(`📊 API: ${API_BASE}/api`);
      console.log(`🌐 Web: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
