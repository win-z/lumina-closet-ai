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
import { ClothingItemModel, DiaryEntryModel, AnalysisResultModel } from '../models';
import { asyncHandler, Errors } from '../middleware/errorHandler';
import { ApiResponse, ClothingCategory } from '../types';

const router = Router();

/**
 * 计算摘要统计（内部共功能函数，可被 getSummary 和 refresh 复用）
 */
async function computeSummary(userId: string) {
  const wardrobe = await ClothingItemModel.findByUserId(userId);
  const diaryCount = await DiaryEntryModel.countByUserId(userId);

  const itemsWithPrice = wardrobe.filter(item => Number(item.price) > 0);
  const totalValue = itemsWithPrice.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const averagePrice = itemsWithPrice.length > 0 ? Math.round(totalValue / itemsWithPrice.length) : 0;
  const maxPrice = itemsWithPrice.length > 0 ? Math.max(...itemsWithPrice.map(i => Number(i.price) || 0)) : 0;
  const minPrice = itemsWithPrice.length > 0 ? Math.min(...itemsWithPrice.map(i => Number(i.price) || 0)) : 0;

  const categoryStats: Record<string, number> = {};
  wardrobe.forEach(item => {
    categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
  });

  const colorStats: Record<string, number> = {};
  wardrobe.forEach(item => {
    colorStats[item.color] = (colorStats[item.color] || 0) + 1;
  });

  const tagStats: Record<string, number> = {};
  wardrobe.forEach(item => {
    item.tags.forEach(tag => {
      tagStats[tag] = (tagStats[tag] || 0) + 1;
    });
  });

  const topWorn = await DiaryEntryModel.getMostWornClothing(userId, 10);
  const topWornItems = await ClothingItemModel.findByIds(topWorn.map(w => w.clothingId));

  return {
    totalItems: wardrobe.length,
    totalValue,
    priceStats: {
      totalValue,
      averagePrice,
      maxPrice,
      minPrice,
      itemsWithPrice: itemsWithPrice.length
    },
    diaryCount,
    categoryStats,
    colorStats,
    tagStats,
    topWorn: topWorn.map(w => ({
      ...topWornItems.find(i => i.id === w.clothingId),
      wearCount: w.count,
    })).filter(Boolean),
  };
}

/** 缓存有效期：24小时（毫秒） */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/analytics/summary
 * 优先返回 24h 内的缓存，否则重新计算并写入缓存
 */
const getSummary = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;

  // 读取最新缓存
  const cached = await AnalysisResultModel.findLatestByUserId(userId);
  if (cached) {
    const age = Date.now() - new Date(cached.createdAt).getTime();
    if (age < CACHE_TTL_MS && cached.aiAnalysis) {
      try {
        const summaryData = JSON.parse(cached.aiAnalysis);
        return res.json({
          success: true,
          message: '获取成功（缓存）',
          data: { ...summaryData, _cached: true, _cachedAt: cached.createdAt },
        });
      } catch {
        // 缓存格式错误，继续重新计算
      }
    }
  }

  // 缓存过期或不存在，重新计算
  const data = await computeSummary(userId);

  // 异步写入缓存（不阻塞响应）
  AnalysisResultModel.create(userId, {
    categoryStats: data.categoryStats,
    colorStats: data.colorStats,
    brandStats: {},
    priceStats: data.priceStats,
    wearStats: [],
    aiAnalysis: JSON.stringify(data), // 将完整 summary 序列化存入 aiAnalysis
  }).catch(() => { }); // 缓存写入失败不影响主流程


  res.json({
    success: true,
    message: '获取成功',
    data: { ...data, _cached: false },
  });
});

/**
 * POST /api/analytics/refresh
 * 强制重新计算并更新缓存
 */
const refreshSummary = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const data = await computeSummary(userId);

  // 同步写入缓存
  await AnalysisResultModel.create(userId, {
    categoryStats: data.categoryStats,
    colorStats: data.colorStats,
    brandStats: {},
    priceStats: data.priceStats,
    wearStats: [],
    aiAnalysis: JSON.stringify(data), // 将完整 summary 序列化存入 aiAnalysis
  });


  res.json({
    success: true,
    message: '分析已刷新',
    data: { ...data, _cached: false },
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
    acc[item.category].totalValue += Number(item.price) || 0;

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

/**
 * GET /api/analytics/latest
 * 获取最新的分析结果
 */
const getLatestAnalysis = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;

  const latestAnalysis = await AnalysisResultModel.findLatestByUserId(userId);

  res.json({
    success: true,
    message: '获取成功',
    data: latestAnalysis,
  });
});

/**
 * POST /api/analytics/save
 * 保存分析结果
 */
const saveAnalysis = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const { categoryStats, colorStats, brandStats, priceStats, wearStats, aiAnalysis } = req.body;

  const analysis = await AnalysisResultModel.create(userId, {
    categoryStats: categoryStats || {},
    colorStats: colorStats || {},
    brandStats: brandStats || {},
    priceStats: priceStats || { totalValue: 0, averagePrice: 0, maxPrice: 0, minPrice: 0 },
    wearStats: wearStats || [],
    aiAnalysis,
  });

  res.status(201).json({
    success: true,
    message: '分析结果保存成功',
    data: analysis,
  });
});

/**
 * GET /api/analytics/brand
 * 获取品牌统计
 */
const getBrandStats = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const wardrobe = await ClothingItemModel.findByUserId(userId);

  const brandStats: Record<string, { count: number; totalValue: number; items: any[] }> = {};
  wardrobe.forEach((item) => {
    const brand = item.brand || '未标注品牌';
    if (!brandStats[brand]) {
      brandStats[brand] = { count: 0, totalValue: 0, items: [] };
    }
    brandStats[brand].count++;
    brandStats[brand].totalValue += Number(item.price) || 0;
    brandStats[brand].items.push({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      imageFront: item.imageFront,
    });
  });

  // 转换为数组并排序
  const sortedBrands = Object.entries(brandStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count);

  res.json({
    success: true,
    message: '获取成功',
    data: {
      totalBrands: sortedBrands.length,
      brands: sortedBrands,
    },
  });
});

/**
 * GET /api/analytics/price
 * 获取价格统计
 */
const getPriceStats = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const wardrobe = await ClothingItemModel.findByUserId(userId);

  const itemsWithPrice = wardrobe.filter((item) => Number(item.price) > 0);
  const totalValue = itemsWithPrice.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const stats = {
    totalItems: wardrobe.length,
    itemsWithPrice: itemsWithPrice.length,
    totalValue,
    averagePrice: itemsWithPrice.length > 0 ? Math.round(totalValue / itemsWithPrice.length) : 0,
    maxPrice: itemsWithPrice.length > 0 ? Math.max(...itemsWithPrice.map((i) => Number(i.price) || 0)) : 0,
    minPrice: itemsWithPrice.length > 0 ? Math.min(...itemsWithPrice.map((i) => Number(i.price) || 0)) : 0,
    priceRanges: {
      '0-100': itemsWithPrice.filter((i) => (Number(i.price) || 0) <= 100).length,
      '100-300': itemsWithPrice.filter((i) => (Number(i.price) || 0) > 100 && (Number(i.price) || 0) <= 300).length,
      '300-500': itemsWithPrice.filter((i) => (Number(i.price) || 0) > 300 && (Number(i.price) || 0) <= 500).length,
      '500-1000': itemsWithPrice.filter((i) => (Number(i.price) || 0) > 500 && (Number(i.price) || 0) <= 1000).length,
      '1000+': itemsWithPrice.filter((i) => (Number(i.price) || 0) > 1000).length,
    },
  };

  res.json({
    success: true,
    message: '获取成功',
    data: stats,
  });
});

/**
 * GET /api/analytics/wear
 * 获取穿着频率统计
 */
const getWearFrequencyStats = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;

  // 从日记记录获取穿着统计（ClothingRecordModel 已移除，使用日记数据）
  const wearStats = await DiaryEntryModel.getMostWornClothing(userId, 100);
  const clothingIds = wearStats.map((s) => s.clothingId);
  const clothingItems = await ClothingItemModel.findByIds(clothingIds);

  // 获取未穿着的衣物
  const allWardrobe = await ClothingItemModel.findByUserId(userId);
  const wornIds = new Set(clothingIds);
  const unwornItems = allWardrobe.filter((item) => !wornIds.has(item.id));

  const stats = {
    totalWorn: wearStats.length,
    totalUnworn: unwornItems.length,
    mostWorn: wearStats.slice(0, 10).map((stat) => {
      const item = clothingItems.find((i) => i.id === stat.clothingId);
      return {
        ...stat,
        wearCount: stat.count,
        clothingItem: item,
      };
    }),
    unwornItems: unwornItems.slice(0, 10).map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      imageFront: item.imageFront,
      lastWorn: item.lastWorn,
    })),
  };

  res.json({
    success: true,
    message: '获取成功',
    data: stats,
  });
});

// ==================== 路由注册 ====================

router.get('/summary', getSummary);
router.post('/refresh', refreshSummary);
router.get('/category', getCategoryStats);
router.get('/usage', getUsageStats);
router.get('/recommendations', getRecommendations);
router.get('/latest', getLatestAnalysis);
router.post('/save', saveAnalysis);
router.get('/brand', getBrandStats);
router.get('/price', getPriceStats);
router.get('/wear', getWearFrequencyStats);


export default router;
