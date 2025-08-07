/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth';
import stocksRoutes from './routes/stocks';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();


const app: express.Application = express();

// CORS配置 - 针对Vercel环境优化
app.use(cors({
  origin: function (origin, callback) {
    // 允许所有来源，包括localhost和Vercel域名
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
  optionsSuccessStatus: 200
}));

// 添加额外的CORS头
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stocksRoutes);

/**
 * health check endpoint - 增强版
 * 提供详细的系统状态信息，帮助诊断Vercel环境中的问题
 */
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const healthInfo = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV || 'unknown'
      },
      vercel: {
        region: process.env.VERCEL_REGION || 'unknown',
        deployment: process.env.VERCEL_URL || 'local'
      },
      apis: {
         sina: 'checking...',
         tencent: 'checking...'
       }
     };
     
     // 快速测试外部API连接
     try {
       const sinaTest = await axios.get('https://hq.sinajs.cn/list=sh000001', { timeout: 3000 });
       healthInfo.apis.sina = sinaTest.status === 200 ? 'available' : 'error';
     } catch {
       healthInfo.apis.sina = 'unavailable';
     }
     
     try {
       const tencentTest = await axios.get('https://qt.gtimg.cn/q=sh000001', { timeout: 3000 });
       healthInfo.apis.tencent = tencentTest.status === 200 ? 'available' : 'error';
     } catch {
       healthInfo.apis.tencent = 'unavailable';
     }
     
     console.log('Health check completed:', {
       timestamp: healthInfo.timestamp,
       userAgent: req.get('User-Agent'),
       ip: req.ip || req.connection.remoteAddress,
       apiStatus: healthInfo.apis
     });
     
     res.json(healthInfo);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * error handler middleware - 增强版
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  const errorDetails = {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    headers: req.headers,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  };
  
  console.error('API错误详情:', errorDetails);
  
  // 设置CORS头
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: error.message || 'Something went wrong',
    timestamp: new Date().toISOString(),
    path: req.url
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