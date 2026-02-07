/**
 * ==================== 用户管理路由 ====================
 * 处理用户档案、设置等管理相关请求
 */

import { Router, Request, Response } from 'express';
import { UserModel, BodyProfileModel, ClothingItemModel, DiaryEntryModel } from '../models';
import { CosService } from '../services/cos';
import { asyncHandler, Errors } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { bodyProfileSchema } from '../middleware/validation';
import { ApiResponse } from '../types';
import { cleanBase64Prefix } from '../utils/helper';

const router = Router();

/**
 * GET /api/users/profile
 * 获取当前用户信息
 */
const getProfile = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;

  const account = await UserModel.findById(userId);
  if (!account) {
    throw Errors.notFound('用户不存在');
  }

  const profile = await BodyProfileModel.findByUserId(userId);

  res.json({
    success: true,
    message: '获取成功',
    data: {
      account: {
        id: account.id,
        email: account.email,
        username: account.username,
        createdAt: account.createdAt,
        lastLoginAt: account.lastLoginAt,
      },
      profile: profile || null,
    },
  });
});

/**
 * PUT /api/users/profile
 * 更新身体档案（自动上传照片到COS）
 */
const updateProfile = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const profileData = req.body;

  let photoFront = profileData.photoFront || undefined;
  let photoSide = profileData.photoSide || undefined;
  let photoBack = profileData.photoBack || undefined;

  if (photoFront && photoFront.startsWith('data:')) {
    const result = await CosService.uploadBase64Image(cleanBase64Prefix(photoFront), userId);
    photoFront = result.url;
  }

  if (photoSide && photoSide.startsWith('data:')) {
    const result = await CosService.uploadBase64Image(cleanBase64Prefix(photoSide), userId);
    photoSide = result.url;
  }

  if (photoBack && photoBack.startsWith('data:')) {
    const result = await CosService.uploadBase64Image(cleanBase64Prefix(photoBack), userId);
    photoBack = result.url;
  }

  let profile = await BodyProfileModel.findByUserId(userId);

  if (profile) {
    profile = await BodyProfileModel.update(profile.id, {
      name: profileData.name || profile.name,
      heightCm: profileData.heightCm || profile.heightCm,
      weightKg: profileData.weightKg || profile.weightKg,
      photoFront,
      photoSide,
      photoBack,
      description: profileData.description,
    });
  } else {
    profile = await BodyProfileModel.create(userId, {
      name: profileData.name || '默认档案',
      heightCm: profileData.heightCm || 170,
      weightKg: profileData.weightKg || 60,
      photoFront,
      photoSide,
      photoBack,
      description: profileData.description,
    });
  }

  res.json({
    success: true,
    message: '更新成功',
    data: { profile },
  });
});

/**
 * GET /api/users/stats
 * 获取用户统计数据
 */
const getStats = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;

  const wardrobeCount = await ClothingItemModel.countByUserId(userId);
  const diaryCount = await DiaryEntryModel.countByUserId(userId);

  const wardrobe = await ClothingItemModel.findByUserId(userId);
  const categoryStats: Record<string, number> = {};
  wardrobe.forEach(item => {
    categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
  });

  const topWorn = await DiaryEntryModel.getMostWornClothing(userId, 5);
  const clothingItems = await ClothingItemModel.findByIds(topWorn.map(w => w.clothingId));
  const topWornWithDetails = topWorn.map(w => ({
    ...clothingItems.find(c => c.id === w.clothingId),
    wearCount: w.count,
  })).filter(Boolean);

  res.json({
    success: true,
    message: '获取成功',
    data: {
      wardrobeCount,
      diaryCount,
      categoryStats,
      topWorn: topWornWithDetails,
    },
  });
});

router.get('/profile', getProfile);
router.put('/profile', validate(bodyProfileSchema, 'body'), updateProfile);
router.get('/stats', getStats);

export default router;
