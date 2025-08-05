import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './config';
import agentRoutes from './routes/agent';
import { agentService } from './services/agent';
import logger from './utils/logger';

// Validate configuration
validateConfig();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow any origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes
app.use('/agent', agentRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Agent Server is running!',
    version: '1.0.0',
    endpoints: {
      'POST /agent/message': 'Send a message to the AI agent',
      'GET /agent/stats': 'Get agent statistics',
      'POST /agent/clear': 'Clear all agent data',
      'GET /agent/health': 'Health check',
    },
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Initialize the agent
    await agentService.initialize();
    
    // Start the server
    app.listen(config.port, () => {
      logger.info(`🚀 AI Agent Server running on port ${config.port}`);
      logger.info(`📚 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 Health check: http://localhost:${config.port}/agent/health`);
      logger.info(`📊 Stats: http://localhost:${config.port}/agent/stats`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer(); 