/**
 * ==================== 衣橱管理路由 ====================
 * 处理服装单品的增删改查
 */

import { Router, Request, Response } from 'express';
import { ClothingItemModel } from '../models';
import { CosService } from '../services/cos';
import { aiService } from '../services/ai';
import { asyncHandler, Errors } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { clothingItemSchema, uuidSchema } from '../middleware/validation';
import { ApiResponse, ClothingItem, ClothingCategory } from '../types';
import { cleanBase64Prefix } from '../utils/helper';

const router = Router();
const createItemSchema = clothingItemSchema;
const updateItemSchema = clothingItemSchema.partial();

/**
 * GET /api/wardrobe
 * 获取用户衣橱列表
 */
const listWardrobe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { category, page, limit } = req.query as { category?: string; page?: string; limit?: string };

  const pageNum = Math.max(1, parseInt(page || '1', 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));

  const items = await ClothingItemModel.findByUserId(userId, {
    category: category as ClothingCategory,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  });
  const total = await ClothingItemModel.countByUserId(userId);

  res.json({
    success: true,
    message: '获取成功',
    data: items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * POST /api/wardrobe
 * 添加新单品（自动上传图片到COS + AI自动标签）
 */
const createItem = asyncHandler(async (req: Request, res: Response<ApiResponse<ClothingItem>>) => {
  const userId = req.user!.userId;
  const itemData = req.body;

  let imageFront: string | undefined = itemData.imageFront || undefined;

  // 上传图片到COS
  if (imageFront && imageFront.startsWith('data:')) {
    const result = await CosService.uploadBase64Image(cleanBase64Prefix(imageFront), userId);
    imageFront = result.url;
  }

  // 使用前端传来的AI识别结果（不再重复调用AI）
  const item = await ClothingItemModel.create(userId, {
    imageFront,
    category: itemData.category as ClothingCategory,
    name: itemData.name,
    color: itemData.color,
    brand: itemData.brand || null,
    price: itemData.price || null,
    purchaseDate: itemData.purchaseDate || null,
    tags: itemData.tags || [],
    lastWorn: itemData.lastWorn || null,
  });

  res.status(201).json({
    success: true,
    message: '添加成功',
    data: item,
  });
});

/**
 * GET /api/wardrobe/:id
 * 获取单品详情
 */
const getItem = asyncHandler(async (req: Request, res: Response<ApiResponse<ClothingItem>>) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const item = await ClothingItemModel.findById(id, userId);
  if (!item) {
    throw Errors.notFound('单品不存在');
  }

  res.json({
    success: true,
    message: '获取成功',
    data: item,
  });
});

/**
 * PUT /api/wardrobe/:id
 * 更新单品
 */
const updateItem = asyncHandler(async (req: Request, res: Response<ApiResponse<ClothingItem>>) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const updateData = req.body;

  const existingItem = await ClothingItemModel.findById(id, userId);
  if (!existingItem) {
    throw Errors.notFound('单品不存在');
  }

  if (updateData.imageFront && updateData.imageFront.startsWith('data:')) {
    const result = await CosService.uploadBase64Image(cleanBase64Prefix(updateData.imageFront), userId);
    updateData.imageFront = result.url;
  }

  const item = await ClothingItemModel.update(id, userId, updateData as any);

  res.json({
    success: true,
    message: '更新成功',
    data: item!,
  });
});

/**
 * DELETE /api/wardrobe/:id
 * 删除单品
 */
const deleteItem = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const existingItem = await ClothingItemModel.findById(id, userId);
  if (!existingItem) {
    throw Errors.notFound('单品不存在');
  }

  await ClothingItemModel.delete(id, userId);

  res.json({
    success: true,
    message: '删除成功',
  });
});

/**
 * POST /api/wardrobe/:id/wear
 * 标记为已穿着
 */
const markAsWorn = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const item = await ClothingItemModel.findById(id, userId);
  if (!item) {
    throw Errors.notFound('单品不存在');
  }

  const today = new Date().toISOString().split('T')[0];
  await ClothingItemModel.updateLastWorn(id, userId, today);

  res.json({
    success: true,
    message: '已标记为今天穿着',
  });
});

router.get('/', listWardrobe);
router.post('/', validate(createItemSchema, 'body'), createItem);
router.get('/:id', validate(uuidSchema, 'params'), getItem);
router.put('/:id', validate(uuidSchema, 'params'), validate(updateItemSchema, 'body'), updateItem);
router.delete('/:id', validate(uuidSchema, 'params'), deleteItem);
router.post('/:id/wear', validate(uuidSchema, 'params'), markAsWorn);

export default router;
