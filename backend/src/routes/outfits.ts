/**
 * ==================== 已保存搭配路由 ====================
 * 处理穿搭的保存和管理
 */

import { Router, Request, Response } from 'express';
import { SavedOutfitModel, ClothingItemModel } from '../models';
import { asyncHandler, Errors } from '../middleware/errorHandler';
import { ApiResponse, SavedOutfit } from '../types';
import { cosService, CosService } from '../services/cos';
import { z } from 'zod';

const router = Router();

const createOutfitSchema = z.object({
  name: z.string().optional(),
  tags: z.array(z.string()).optional(),
  weather: z.string().optional(),
  occasion: z.string().optional(),
  dressId: z.string().optional(),
  topId: z.string().optional(),
  bottomId: z.string().optional(),
  shoesId: z.string().optional(),
  reasoning: z.string().optional(),
  tryonImage: z.string().optional(),
});

// GET /api/outfits - 获取已保存搭配列表
const listOutfits = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const outfits = await SavedOutfitModel.findByUserId(userId);

  // 获取搭配中的服装详情
  const outfitsWithItems = await Promise.all(outfits.map(async (outfit) => {
    const clothingItems = [];
    if (outfit.dressId) {
      const item = await ClothingItemModel.findById(outfit.dressId, userId);
      if (item) clothingItems.push(item);
    }
    if (outfit.topId) {
      const item = await ClothingItemModel.findById(outfit.topId, userId);
      if (item) clothingItems.push(item);
    }
    if (outfit.bottomId) {
      const item = await ClothingItemModel.findById(outfit.bottomId, userId);
      if (item) clothingItems.push(item);
    }
    if (outfit.shoesId) {
      const item = await ClothingItemModel.findById(outfit.shoesId, userId);
      if (item) clothingItems.push(item);
    }
    return { ...outfit, clothingItems };
  }));

  res.json({
    success: true,
    message: '获取成功',
    data: outfitsWithItems,
  });
});

// POST /api/outfits - 保存新搭配
const createOutfit = asyncHandler(async (req: Request, res: Response<ApiResponse<SavedOutfit>>) => {
  const userId = req.user!.userId;
  const outfitData = req.body;

  // 验证服装ID是否属于该用户
  if (outfitData.dressId) {
    const item = await ClothingItemModel.findById(outfitData.dressId, userId);
    if (!item) throw Errors.badRequest('连衣裙不存在或无权访问');
  }
  if (outfitData.topId) {
    const item = await ClothingItemModel.findById(outfitData.topId, userId);
    if (!item) throw Errors.badRequest('上装不存在或无权访问');
  }
  if (outfitData.bottomId) {
    const item = await ClothingItemModel.findById(outfitData.bottomId, userId);
    if (!item) throw Errors.badRequest('下装不存在或无权访问');
  }
  if (outfitData.shoesId) {
    const item = await ClothingItemModel.findById(outfitData.shoesId, userId);
    if (!item) throw Errors.badRequest('鞋履不存在或无权访问');
  }

  // 处理图片：如果是 base64，上传到 COS
  let tryonImageUrl = outfitData.tryonImage;
  if (tryonImageUrl && tryonImageUrl.startsWith('data:image')) {
    try {
      // 上传 base64 图片到 COS
      const uploadResult = await CosService.uploadBase64Image(tryonImageUrl, userId);
      tryonImageUrl = uploadResult.url;
    } catch (err) {
      console.error('上传搭配图片失败:', err);
      throw Errors.badRequest('图片上传失败，请重试');
    }
  }

  const outfit = await SavedOutfitModel.create(userId, {
    name: outfitData.name,
    tags: outfitData.tags || [],
    weather: outfitData.weather,
    occasion: outfitData.occasion,
    dressId: outfitData.dressId,
    topId: outfitData.topId,
    bottomId: outfitData.bottomId,
    shoesId: outfitData.shoesId,
    reasoning: outfitData.reasoning,
    tryonImage: tryonImageUrl,
  });

  res.status(201).json({
    success: true,
    message: '保存成功',
    data: outfit,
  });
});

// GET /api/outfits/:id - 获取搭配详情
const getOutfitById = asyncHandler(async (req: Request, res: Response<ApiResponse<SavedOutfit>>) => {
  const userId = req.user!.userId;
  const id = req.params.id;

  // 确保 id 是字符串
  const outfitId = Array.isArray(id) ? id[0] : id;

  const outfit = await SavedOutfitModel.findById(outfitId, userId);
  if (!outfit) {
    throw Errors.notFound('搭配不存在');
  }

  res.json({
    success: true,
    message: '获取成功',
    data: outfit,
  });
});

// PUT /api/outfits/:id - 更新搭配
const updateOutfitById = asyncHandler(async (req: Request, res: Response<ApiResponse<SavedOutfit>>) => {
  const userId = req.user!.userId;
  const id = req.params.id;

  // 确保 id 是字符串
  const outfitId = Array.isArray(id) ? id[0] : id;

  const updateData = req.body;

  const outfit = await SavedOutfitModel.update(outfitId, userId, updateData);
  if (!outfit) {
    throw Errors.notFound('搭配不存在');
  }

  res.json({
    success: true,
    message: '更新成功',
    data: outfit,
  });
});

// DELETE /api/outfits/:id - 删除搭配
const deleteOutfitById = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const id = req.params.id;

  // 确保 id 是字符串
  const outfitId = Array.isArray(id) ? id[0] : id;

  const deleted = await SavedOutfitModel.delete(outfitId, userId);
  if (!deleted) {
    throw Errors.notFound('搭配不存在');
  }

  res.json({
    success: true,
    message: '删除成功',
  });
});

router.get('/', listOutfits);
router.post('/', createOutfit);
router.get('/:id', getOutfitById);
router.put('/:id', updateOutfitById);
router.delete('/:id', deleteOutfitById);

export default router;
