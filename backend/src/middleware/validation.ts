/**
 * ==================== 请求验证中间件 ====================
 * 使用Zod进行数据验证，提供类型安全的请求体验
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './errorHandler';

/**
 * 验证请求体、查询参数或路径参数
 */
export const validate = (
  schema: z.ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new AppError('请求数据验证失败', 400, 'VALIDATION_ERROR', errors);
      }

      if (source === 'body') {
        req.body = result.data;
      } else if (source === 'query') {
        Object.assign(req.query, result.data);
      } else if (source === 'params') {
        Object.assign(req.params, result.data);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('验证处理失败', 500, 'VALIDATION_PROCESSING_ERROR'));
      }
    }
  };
};

// ==================== 常用验证Schema ====================

// UUID验证
export const uuidSchema = z.object({
  id: z.string().uuid('无效的ID格式'),
});

// 服装单项基本验证
const clothingCategories = ['上装', '下装', '连衣裙', '外套', '鞋履', '配饰'] as const;

export const clothingItemSchema = z.object({
  imageFront: z.string().optional().nullable(),
  imageBack: z.string().optional().nullable(),
  category: z.union([z.enum(clothingCategories), z.literal('')]).optional().nullable().transform(v => v === '' ? undefined : v),
  name: z.string().min(0).max(100).optional().nullable().transform(v => v || ''),
  color: z.string().min(0).max(50).optional().nullable().transform(v => v || ''),
  brand: z.string().max(100).optional().nullable(),
  price: z.number().positive().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  tags: z.array(z.string()).min(0).max(20).default([]),
});

// 用户档案验证
export const bodyProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  heightCm: z.number().min(50).max(300).optional(),
  weightKg: z.number().min(20).max(500).optional(),
  description: z.string().max(500).optional(),
  photoFront: z.string().optional(),
  photoSide: z.string().optional(),
  photoBack: z.string().optional(),
});

// 日记条目验证
export const diaryEntrySchema = z.object({
  date: z.string(),
  weather: z.string().min(1).max(50),
  mood: z.string().min(1).max(50),
  notes: z.string().max(2000).optional(),
  clothingIds: z.array(z.string()).optional(),
  photo: z.string().optional(),
});

// 穿搭建议请求验证
export const outfitSuggestionSchema = z.object({
  weather: z.string().min(1),
  occasion: z.string().min(1),
});

export default {
  validate,
  uuidSchema,
  clothingItemSchema,
  bodyProfileSchema,
  diaryEntrySchema,
  outfitSuggestionSchema,
};
