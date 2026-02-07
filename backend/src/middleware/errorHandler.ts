/**
 * ==================== 错误处理中间件 ====================
 * 统一处理应用中的错误，返回标准化的错误响应
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found 处理器
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(
    `请求的资源不存在: ${req.method} ${req.originalUrl}`,
    404,
    'NOT_FOUND'
  );
  next(error);
};

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 如果不是 AppError，包装为内部错误
  const appError = err instanceof AppError
    ? err
    : new AppError(err.message || '内部服务器错误', 500, 'INTERNAL_ERROR');

  // 记录错误日志
  if (appError.statusCode >= 500) {
    logger.error('服务器错误:', {
      message: appError.message,
      stack: appError.stack,
      path: req.originalUrl,
      method: req.method,
    });
  } else {
    logger.warn('客户端错误:', {
      message: appError.message,
      code: appError.code,
      path: req.originalUrl,
      method: req.method,
    });
  }

  // 构建响应
  const response: ApiResponse = {
    success: false,
    message: appError.message,
    error: {
      code: appError.code,
      details: appError.details,
    },
  };

  // 发送响应
  res.status(appError.statusCode).json(response);
};

/**
 * 异步路由包装器
 * 自动捕获异步函数中的错误并传递给错误处理中间件
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 常用错误快捷方法
 */
export const Errors = {
  badRequest: (message: string = '请求参数错误', details?: unknown): AppError => {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  },

  unauthorized: (message: string = '未授权访问'): AppError => {
    return new AppError(message, 401, 'UNAUTHORIZED');
  },

  forbidden: (message: string = '禁止访问'): AppError => {
    return new AppError(message, 403, 'FORBIDDEN');
  },

  notFound: (message: string = '资源不存在'): AppError => {
    return new AppError(message, 404, 'NOT_FOUND');
  },

  conflict: (message: string = '资源冲突'): AppError => {
    return new AppError(message, 409, 'CONFLICT');
  },

  internal: (message: string = '内部服务器错误'): AppError => {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  },

  serviceUnavailable: (message: string = '服务不可用'): AppError => {
    return new AppError(message, 503, 'SERVICE_UNAVAILABLE');
  },
};

export default {
  AppError,
  notFoundHandler,
  errorHandler,
  asyncHandler,
  Errors,
};
