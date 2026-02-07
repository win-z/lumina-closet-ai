/**
 * ==================== API根路由 ====================
 * 提供API概览信息
 */

import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /
 * API根路径，返回API信息
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Lumina Closet AI API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      wardrobe: '/api/wardrobe',
      diary: '/api/diary',
      analytics: '/api/analytics',
      ai: '/api/ai',
    },
    documentation: 'See /health for API status',
  });
});

export default router;
