/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import stocksRoutes from './routes/stocks.js';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();


const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stocksRoutes);

/**
 * health check endpoint
 * 提供服务器健康状态检查
 */
app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const healthData = {
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
      }
    };
    
    console.log('Health check requested:', {
      timestamp: healthData.timestamp,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    });
    
    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check failed:', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  });
});

export default app;