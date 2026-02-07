/**
 * ==================== JWT认证中间件 ====================
 * 验证请求中的JWT Token，解析用户信息并附加到请求对象
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload, ApiResponse } from '../types';
import { AppError } from './errorHandler';

/**
 * 扩展Express Request类型，添加user属性
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT认证中间件
 *
 * 工作流程:
 * 1. 从请求头 Authorization 字段提取 Bearer Token
 * 2. 验证Token的签名和有效期
 * 3. 将解码后的用户信息附加到 req.user
 * 4. 验证失败则返回401错误
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // 1. 获取Authorization头
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('缺少认证令牌', 401, 'MISSING_TOKEN');
    }

    // 2. 验证格式 (Bearer <token>)
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('认证令牌格式无效', 401, 'INVALID_TOKEN_FORMAT');
    }

    const token = parts[1];

    // 3. 验证JWT签名
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // 4. 附加用户信息到请求
    req.user = decoded;

    // 5. 继续处理
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('认证令牌已过期', 401, 'TOKEN_EXPIRED'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('认证令牌无效', 401, 'INVALID_TOKEN'));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('认证失败', 401, 'AUTHENTICATION_FAILED'));
    }
  }
};

/**
 * 可选认证中间件
 * 如果请求带有有效Token则解析，否则继续但不设置user
 */
export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  try {
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
  } catch {
    // 忽略错误，仅跳过认证
  }

  next();
};

/**
 * 生成JWT Token
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: `${config.jwt.expiresIn}h`,
  });
};

/**
 * 验证并刷新Token
 */
export const refreshToken = (currentToken: string): string | null => {
  try {
    const decoded = jwt.verify(currentToken, config.jwt.secret, {
      ignoreExpiration: true,
    }) as JwtPayload;

    // 检查Token是否已过期超过7天
    const expiryDate = decoded.exp ? new Date(decoded.exp * 1000) : new Date();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (expiryDate < sevenDaysAgo) {
      return null; // Token太旧，需要重新登录
    }

    // 生成新Token
    return generateToken({
      userId: decoded.userId,
      email: decoded.email,
    });
  } catch {
    return null;
  }
};

export default {
  authMiddleware,
  optionalAuthMiddleware,
  generateToken,
  refreshToken,
};
