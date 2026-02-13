/**
 * ==================== AI功能路由（硅基流动） ====================
 *
 * API端点:
 * - POST /api/ai/auto-tag        - 服装图像自动标签
 * - POST /api/ai/outfit          - AI穿搭建议
 * - POST /api/ai/try-on          - 虚拟试穿
 * - POST /api/ai/analyze         - 衣橱健康分析
 */

import { Router, Request, Response } from 'express';
import { ClothingItemModel, BodyProfileModel } from '../models';
import { aiService } from '../services/ai';
import { virtualTryOnService } from '../services/image';
import { asyncHandler, Errors } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { validate } from '../middleware/validation';
import { ApiResponse } from '../types';
import { z } from 'zod';

const router = Router();

const autoTagSchema = z.object({
  image: z.string().min(1, '图片数据不能为空'),
});

const outfitSchema = z.object({
  weather: z.string().optional(),
  occasion: z.string().optional(),
  topId: z.string().optional(),
  bottomId: z.string().optional(),
  shoesId: z.string().optional(),
  customPrompt: z.string().optional(),
});

const tryOnSchema = z.object({
  topId: z.string().optional(),
  bottomId: z.string().optional(),
  occasion: z.string().default('日常'),
});

/**
 * POST /api/ai/auto-tag
 * 服装图像自动标签
 */
const autoTag = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const { image } = req.body;
  if (!image) throw Errors.badRequest('缺少图片数据');

  const result = await aiService.autoTagClothing(image);

  res.json({ success: true, message: '识别成功', data: result });
});

/**
 * POST /api/ai/outfit
 * AI穿搭建议（硅基流动）
 * 支持手动选择模式：如果提供了topId/bottomId/shoesId，直接使用，不调用AI推荐
 * 支持自定义提示词：如果提供了customPrompt，会加入到AI生成图像的提示词中
 */
const suggestOutfit = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const { weather, occasion, topId, bottomId, shoesId, customPrompt } = req.body;

  const wardrobe = await ClothingItemModel.findByUserId(userId);
  const profile = await BodyProfileModel.findByUserId(userId);

  if (!profile) throw Errors.badRequest('请先完善您的身体档案');
  
  // 检查是手动选择模式还是AI推荐模式
  const isManualMode = topId || bottomId || shoesId;
  
  let suggestion: any;
  let top, bottom, shoes;

  if (isManualMode) {
    // 手动选择模式：直接使用用户选择的服装
    logger.info('手动选择模式', { topId, bottomId, shoesId });
    
    top = topId ? await ClothingItemModel.findById(topId, userId) || undefined : undefined;
    bottom = bottomId ? await ClothingItemModel.findById(bottomId, userId) || undefined : undefined;
    shoes = shoesId ? await ClothingItemModel.findById(shoesId, userId) || undefined : undefined;

    if ((topId && !top) || (bottomId && !bottom) || (shoesId && !shoes)) {
      throw Errors.notFound('所选单品不存在或无权访问');
    }

    suggestion = {
      topId: top?.id,
      bottomId: bottom?.id,
      shoesId: shoes?.id,
      reasoning: `手动选择搭配：${top ? '上装' : ''}${bottom ? ' + 下装' : ''}${shoes ? ' + 鞋履' : ''}，适合${occasion || '日常'}`,
    };
  } else {
    // AI推荐模式：调用AI服务生成建议
    if (wardrobe.length < 2) throw Errors.badRequest('衣橱单品不足，无法生成建议');
    
    logger.info('AI推荐模式', { hasCustomPrompt: !!customPrompt });
    suggestion = await aiService.suggestOutfit(wardrobe, weather || '', occasion || '', profile, customPrompt);
    
    top = wardrobe.find(w => w.id === suggestion.topId);
    bottom = wardrobe.find(w => w.id === suggestion.bottomId);
    shoes = wardrobe.find(w => w.id === suggestion.shoesId);
  }

  let tryOnImage: string | undefined;

  try {
    if (top || bottom) {
      // 使用豆包API生成虚拟试穿图，传入自定义提示词
      logger.info('开始生成虚拟试穿图', { 
        mode: isManualMode ? '手动选择' : 'AI推荐',
        top: top?.name, 
        bottom: bottom?.name,
        hasProfilePhoto: !!profile.photoFront,
        hasCustomPrompt: !!customPrompt
      });
      tryOnImage = await virtualTryOnService.generate(profile, top, bottom, occasion || '日常', customPrompt);
      logger.info('虚拟试穿图生成完成');
    }
  } catch (error) {
    logger.error('生成试穿效果图失败:', error);
  }

  res.json({ success: true, message: '建议生成成功', data: { ...suggestion, items: { top, bottom, shoes }, tryOnImage } });
});

/**
 * POST /api/ai/try-on
 * 虚拟试穿
 */
const virtualTryOn = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const { topId, bottomId, occasion } = req.body;

  const profile = await BodyProfileModel.findByUserId(userId);
  if (!profile) throw Errors.badRequest('请先完善您的身体档案');

  const top = topId ? await ClothingItemModel.findById(topId, userId) || undefined : undefined;
  const bottom = bottomId ? await ClothingItemModel.findById(bottomId, userId) || undefined : undefined;

  if ((topId && !top) || (bottomId && !bottom)) {
    throw Errors.notFound('单品不存在或无权访问');
  }

  const resultImage = await virtualTryOnService.generate(profile, top, bottom, occasion);

  res.json({ success: true, message: '虚拟试穿生成成功', data: { image: resultImage } });
});

/**
 * POST /api/ai/analyze
 * 衣橱健康分析（硅基流动）
 */
const analyzeWardrobe = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const wardrobe = await ClothingItemModel.findByUserId(userId);

  if (wardrobe.length === 0) throw Errors.badRequest('衣橱为空，无法分析');

  const analysis = await aiService.analyzeWardrobeHealth(wardrobe);

  res.json({ success: true, message: '分析完成', data: { analysis, itemCount: wardrobe.length } });
});

router.post('/auto-tag', validate(autoTagSchema, 'body'), autoTag);
router.post('/outfit', validate(outfitSchema, 'body'), suggestOutfit);
router.post('/try-on', validate(tryOnSchema, 'body'), virtualTryOn);
router.post('/analyze', analyzeWardrobe);

export default router;
