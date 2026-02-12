/**
 * ==================== Lumina Closet AI 后端服务器入口 ====================
 *
 * 项目架构说明:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                     Lumina Closet AI 应用架构                    │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  前端 (React + TypeScript + Vite)                               │
 * │  ├── 衣橱管理 | AI穿搭建议 | 虚拟试穿 | 日记 | 数据分析          │
 * │  └── API通信                                                   │
 * └─────────────────────────────────────────────────────────────────┘
 *                              │
 *                              │ HTTP REST API
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  后端 (Node.js + Express + MySQL)                               │
 * │  ├── 认证中间件 (JWT)                                            │
 * │  ├── RESTful API Routes                                          │
 * │  ├── 业务逻辑层 (Services)                                       │
 * │  └── 数据访问层 (Models)                                         │
 * └─────────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  外部AI服务                                                       │
 * │  ├── SiliconFlow (文本生成/图像识别)                              │
 * │  └── 腾讯云 COS (图片存储)                                       │
 * └─────────────────────────────────────────────────────────────────┘
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config';
import { logger, requestLogger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { responseMiddleware } from './middleware/response';
import { query } from './database';
import { initDatabase } from './database/init';

// 导入路由
import indexRoutes from './routes';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import wardrobeRoutes from './routes/wardrobe';
import diaryRoutes from './routes/diary';
import outfitsRoutes from './routes/outfits';
import analyticsRoutes from './routes/analytics';
import aiRoutes from './routes/ai';
import healthRoutes from './routes/health';
import clothingRecordsRoutes from './routes/clothingRecords';


// ==================== 创建Express应用 ====================
const app: Express = express();

// ==================== 基础中间件 ====================

// Helmet - 安全头信息
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS - 跨域资源共享
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// 请求体解析 - JSON
app.use(express.json({ limit: '10mb' }));

// 请求体解析 - URL编码
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use(requestLogger);

// 统一响应中间件
app.use(responseMiddleware);

// ==================== 速率限制 (仅生产环境) ====================
if (config.nodeEnv === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟窗口
    max: 1000, // 每个IP最多1000个请求（放宽限制）
    message: {
      success: false,
      message: '请求过于频繁，请稍后再试',
      error: { code: 'RATE_LIMIT_EXCEEDED' }
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);
  logger.info('✅ 速率限制已启用 (生产环境)');
} else {
  logger.info('⚠️  开发环境：速率限制已禁用');
}

// ==================== 公开路由 (无需认证) ====================

// API根路径
app.use('/', indexRoutes);

// 健康检查
app.use('/health', healthRoutes);

// 认证路由
app.use('/api/auth', authRoutes);

// ==================== 受保护路由 (需要JWT认证) ====================

// 所有 /api/* 路由应用认证中间件 (除认证路由外)
app.use('/api', authMiddleware);

// 用户管理
app.use('/api/users', userRoutes);

// 衣橱管理
app.use('/api/wardrobe', wardrobeRoutes);

// 日记管理
app.use('/api/diary', diaryRoutes);

// 已保存搭配管理
app.use('/api/outfits', outfitsRoutes);

// 数据分析
app.use('/api/analytics', analyticsRoutes);

// 穿着记录
app.use('/api/clothing-records', clothingRecordsRoutes);

// AI功能
app.use('/api/ai', aiRoutes);

// ==================== 404处理 ====================
app.use(notFoundHandler);

// ==================== 错误处理 ====================
app.use(errorHandler);

// ==================== 启动服务器 ====================
const PORT = config.port;

// 导入数据库适配器以触发表初始化
import { getDatabaseAdapter } from './database/adapter';
const db = getDatabaseAdapter(); // 触发表创建

// 初始化数据库并启动服务
const startServer = async () => {
  // 初始化数据库表
  await initDatabase();
  
  // 启动服务
  app.listen(PORT, () => {
    logger.info(`🚀 Lumina Closet AI 后端服务已启动`);
    logger.info(`   环境: ${config.nodeEnv}`);
    logger.info(`   端口: ${PORT}`);
    logger.info(`   文档: http://localhost:${PORT}/health`);
    logger.info(`   API基础路径: http://localhost:${PORT}/api`);
  });
};

startServer();

// ==================== 优雅关闭处理 ====================
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在关闭服务...');
  process.exit(0);
});

export default app;
