/**
 * ==================== 健康检查路由 ====================
 * 提供服务状态和基本信息的公开端点
 */

import { Router, Request, Response } from 'express';
import { config } from '../config';

const router = Router();

/**
 * GET /health
 * 服务健康检查端点
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '服务运行正常',
    data: {
      service: 'Lumina Closet AI Backend',
      version: '1.0.0',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

/**
 * GET /health/ready
 * 就绪检查端点（用于Kubernetes等编排系统）
 */
router.get('/ready', (req: Request, res: Response) => {
  // 这里可以添加更多就绪检查逻辑，如数据库连接
  res.json({
    success: true,
    message: '服务就绪',
    data: { ready: true },
  });
});

/**
 * GET /health/live
 * 存活检查端点（用于Kubernetes存活探针）
 */
router.get('/live', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '服务存活',
    data: { alive: true },
  });
});

export default router;
