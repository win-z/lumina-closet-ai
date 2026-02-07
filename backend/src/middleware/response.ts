/**
 * ==================== API 响应统一化中间件 ====================
 * 为所有路由提供统一的响应格式
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 扩展 Express Response 类型，添加统一响应方法
 */
declare global {
  namespace Express {
    interface Response {
      success: <T>(data: T, message?: string, pagination?: any) => void;
      created: <T>(data: T, message?: string) => void;
      noContent: (message?: string) => void;
    }
  }
}

/**
 * 统一响应中间件
 * 为 res 对象添加标准化响应方法
 */
export const responseMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  /**
   * 成功响应 (200)
   */
  res.success = <T>(data: T, message: string = '操作成功', pagination?: any): void => {
    const response: any = {
      success: true,
      message,
      data,
    };
    
    if (pagination) {
      response.pagination = pagination;
    }
    
    res.json(response);
  };

  /**
   * 创建成功响应 (201)
   */
  res.created = <T>(data: T, message: string = '创建成功'): void => {
    res.status(201).json({
      success: true,
      message,
      data,
    });
  };

  /**
   * 无内容响应 (204)
   */
  res.noContent = (message: string = '删除成功'): void => {
    res.status(200).json({
      success: true,
      message,
    });
  };

  next();
};

export default responseMiddleware;
