/**
 * ==================== 数据分析路由 ====================
 * 提供衣橱分析和统计功能
 *
 * API端点:
 * - GET    /api/analytics/summary   - 获取衣橱摘要
 * - GET    /api/analytics/category  - 获取分类统计
 * - GET    /api/analytics/color     - 获取颜色分布
 * - GET    /api/analytics/usage     - 获取使用频率统计
 */

import { Router, Request, Response } from 'express';
import { ClothingItemModel, DiaryEntryModel } from '../models';
import { asyncHandler, Errors } from '../middleware/errorHandler';
import { ApiResponse, ClothingCategory } from '../types';

const router = Router();

/**
 * GET /api/analytics/summary
 * 获取衣橱摘要统计
 */
const getSummary = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;

  const wardrobe = await ClothingItemModel.findByUserId(userId);
  const diaryCount = await DiaryEntryModel.countByUserId(userId);

  // 计算总价值
  const totalValue = wardrobe.reduce((sum, item) => sum + (item.price || 0), 0);

  // 分类统计
  const categoryStats: Record<string, number> = {};
  wardrobe.forEach(item => {
    categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
  });

  // 颜色统计
  const colorStats: Record<string, number> = {};
  wardrobe.forEach(item => {
    colorStats[item.color] = (colorStats[item.color] || 0) + 1;
  });

  // 标签统计
  const tagStats: Record<string, number> = {};
  wardrobe.forEach(item => {
    item.tags.forEach(tag => {
      tagStats[tag] = (tagStats[tag] || 0) + 1;
    });
  });

  // 最常穿着
  const topWorn = await DiaryEntryModel.getMostWornClothing(userId, 10);
  const topWornItems = await ClothingItemModel.findByIds(topWorn.map(w => w.clothingId));

  res.json({
    success: true,
    message: '获取成功',
    data: {
      totalItems: wardrobe.length,
      totalValue,
      diaryCount,
      categoryStats,
      colorStats,
      tagStats,
      topWorn: topWorn.map(w => ({
        ...topWornItems.find(i => i.id === w.clothingId),
        wearCount: w.count,
      })).filter(Boolean),
    },
  });
});

/**
 * GET /api/analytics/category
 * 获取分类详细统计
 */
const getCategoryStats = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const wardrobe = await ClothingItemModel.findByUserId(userId);

  const categoryDetails = wardrobe.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = {
        count: 0,
        items: [],
        colors: {} as Record<string, number>,
        totalValue: 0,
      };
    }
    acc[item.category].count++;
    acc[item.category].items.push({
      id: item.id,
      name: item.name,
      color: item.color,
    });
    acc[item.category].colors[item.color] = (acc[item.category].colors[item.color] || 0) + 1;
    acc[item.category].totalValue += item.price || 0;

    return acc;
  }, {} as Record<string, any>);

  res.json({
    success: true,
    message: '获取成功',
    data: categoryDetails,
  });
});

/**
 * GET /api/analytics/usage
 * 获取单品使用频率
 */
const getUsageStats = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;

  // 获取所有穿着记录
  const wornStats = await DiaryEntryModel.getMostWornClothing(userId, 100);
  const itemIds = wornStats.map(w => w.clothingId);
  const items = await ClothingItemModel.findByIds(itemIds);

  // 计算使用率 (穿着次数 / 总日记数)
  const totalDiary = await DiaryEntryModel.countByUserId(userId);

  const usageStats = wornStats.map(w => {
    const item = items.find(i => i.id === w.clothingId);
    return {
      ...item,
      wearCount: w.count,
      usageRate: totalDiary > 0 ? (w.count / totalDiary * 100).toFixed(1) + '%' : '0%',
    };
  });

  res.json({
    success: true,
    message: '获取成功',
    data: {
      totalDiary,
      usageStats,
    },
  });
});

/**
 * GET /api/analytics/recommendations
 * 获取AI驱动的衣橱建议
 */
const getRecommendations = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const wardrobe = await ClothingItemModel.findByUserId(userId);

  const recommendations: string[] = [];

  // 基础检查
  const categories = wardrobe.map(w => w.category);
  const colors = wardrobe.map(w => w.color);

  // 检查是否缺少基础品类
  if (!categories.includes(ClothingCategory.TOP)) {
    recommendations.push('建议添加一些上装单品，如T恤、衬衫等');
  }
  if (!categories.includes(ClothingCategory.BOTTOM)) {
    recommendations.push('建议添加一些下装单品，如牛仔裤、裙子等');
  }
  if (!categories.includes(ClothingCategory.SHOES)) {
    recommendations.push('建议添加一些鞋履单品');
  }

  // 检查颜色多样性
  const uniqueColors = new Set(colors);
  if (uniqueColors.size < 3) {
    recommendations.push('衣橱颜色比较单一，建议尝试更多颜色搭配');
  }

  // 检查是否有基本款
  const hasBasics = wardrobe.some(item =>
    item.tags.includes('休闲') || item.tags.includes('基础')
  );
  if (!hasBasics && wardrobe.length > 0) {
    recommendations.push('建议添加一些基础款单品，更容易搭配');
  }

  // 检查高端场合
  const hasFormal = wardrobe.some(item =>
    item.tags.includes('商务') || item.tags.includes('正式')
  );
  if (!hasFormal && wardrobe.length > 5) {
    recommendations.push('衣橱缺少正式场合的穿搭，建议添加商务风格单品');
  }

  res.json({
    success: true,
    message: '获取成功',
    data: {
      recommendations,
      wardrobeSize: wardrobe.length,
    },
  });
});

// ==================== 路由注册 ====================

router.get('/summary', getSummary);
router.get('/category', getCategoryStats);
router.get('/usage', getUsageStats);
router.get('/recommendations', getRecommendations);

export default router;
