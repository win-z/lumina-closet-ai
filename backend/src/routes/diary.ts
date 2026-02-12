/**
 * ==================== 日记管理路由 ====================
 * 处理穿搭日记的增删改查
 */

import { Router, Request, Response } from 'express';
import { DiaryEntryModel, ClothingItemModel } from '../models';
import { asyncHandler, Errors } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { diaryEntrySchema, uuidSchema } from '../middleware/validation';
import { ApiResponse, DiaryEntry } from '../types';

const router = Router();
const createDiarySchema = diaryEntrySchema;
const updateDiarySchema = diaryEntrySchema.partial();

/**
 * GET /api/diary
 * 获取日记列表
 */
const listDiary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { page, limit, startDate, endDate } = req.query as {
    page?: string;
    limit?: string;
    startDate?: string;
    endDate?: string;
  };

  const pageNum = Math.max(1, parseInt(page || '1', 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));

  const entries = await DiaryEntryModel.findByUserId(userId, {
    startDate,
    endDate,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum,
    orderBy: 'date',
    order: 'DESC',
  });

  const entriesWithClothing = await Promise.all(entries.map(async (entry) => ({
    ...entry,
    clothingItems: entry.clothingIds.length > 0 ? await ClothingItemModel.findByIds(entry.clothingIds) : [],
  })));

  const total = await DiaryEntryModel.countByUserId(userId);

  res.json({
    success: true,
    message: '获取成功',
    data: entriesWithClothing,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * POST /api/diary
 * 创建新日记
 */
const createDiary = asyncHandler(async (req: Request, res: Response<ApiResponse<DiaryEntry>>) => {
  const userId = req.user!.userId;
  const diaryData = req.body;

  if (diaryData.clothingIds && diaryData.clothingIds.length > 0) {
    const items = await ClothingItemModel.findByIds(diaryData.clothingIds);
    const invalidItems = items.filter(item => item && (item as any).userId !== userId);
    if (invalidItems.length > 0) {
      throw Errors.badRequest('包含不属于您的服装单品');
    }
  }

  const entry = await DiaryEntryModel.create(userId, {
    date: diaryData.date,
    weather: diaryData.weather,
    mood: diaryData.mood,
    notes: diaryData.notes,
    clothingIds: diaryData.clothingIds || [],
    photo: diaryData.photo,
  });

  res.status(201).json({
    success: true,
    message: '创建成功',
    data: entry,
  });
});

/**
 * GET /api/diary/:id
 * 获取日记详情
 */
const getDiary = asyncHandler(async (req: Request, res: Response<ApiResponse<DiaryEntry>>) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const entry = await DiaryEntryModel.findById(id, userId);
  if (!entry) {
    throw Errors.notFound('日记不存在');
  }

  res.json({
    success: true,
    message: '获取成功',
    data: entry,
  });
});

/**
 * PUT /api/diary/:id
 * 更新日记
 */
const updateDiary = asyncHandler(async (req: Request, res: Response<ApiResponse<DiaryEntry>>) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const updateData = req.body;

  const entry = await DiaryEntryModel.update(id, userId, updateData);
  if (!entry) {
    throw Errors.notFound('日记不存在');
  }

  res.json({
    success: true,
    message: '更新成功',
    data: entry,
  });
});

/**
 * DELETE /api/diary/:id
 * 删除日记
 */
const deleteDiary = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const deleted = await DiaryEntryModel.delete(id, userId);
  if (!deleted) {
    throw Errors.notFound('日记不存在');
  }

  res.json({
    success: true,
    message: '删除成功',
  });
});

/**
 * GET /api/diary/date/:date
 * 根据日期获取日记
 */
const getDiaryByDate = asyncHandler(async (req: Request, res: Response<ApiResponse<DiaryEntry>>) => {
  const userId = req.user!.userId;
  const date = req.params.date as string;

  const entry = await DiaryEntryModel.findByDate(userId, date);
  if (!entry) {
    res.json({
      success: true,
      message: '该日期无日记记录',
      data: null as any,
    });
    return;
  }

  // 获取关联的服装详情
  const clothingItems = entry.clothingIds.length > 0
    ? await ClothingItemModel.findByIds(entry.clothingIds)
    : [];

  res.json({
    success: true,
    message: '获取成功',
    data: { ...entry, clothingItems } as DiaryEntry & { clothingItems: any[] },
  });
});

/**
 * GET /api/diary/calendar
 * 获取日历数据（某月有日记的日期列表）
 */
const getCalendarData = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const { year, month } = req.query as { year?: string; month?: string };

  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

  const dates = await DiaryEntryModel.getDatesByMonth(userId, currentYear, currentMonth);

  res.json({
    success: true,
    message: '获取成功',
    data: {
      year: currentYear,
      month: currentMonth,
      dates,
    },
  });
});

/**
 * POST /api/diary/upsert
 * 创建或更新日记（用于日历功能）
 */
const upsertDiary = asyncHandler(async (req: Request, res: Response<ApiResponse<DiaryEntry>>) => {
  const userId = req.user!.userId;
  const diaryData = req.body;

  // 验证服装ID是否属于该用户
  if (diaryData.clothingIds && diaryData.clothingIds.length > 0) {
    const items = await ClothingItemModel.findByIds(diaryData.clothingIds);
    const invalidItems = items.filter(item => item && (item as any).userId !== userId);
    if (invalidItems.length > 0) {
      throw Errors.badRequest('包含不属于您的服装单品');
    }
  }

  const entry = await DiaryEntryModel.upsert(userId, {
    date: diaryData.date,
    weather: diaryData.weather,
    mood: diaryData.mood,
    notes: diaryData.notes,
    photo: diaryData.photo,
    clothingIds: diaryData.clothingIds || [],
    outfitId: diaryData.outfitId,
  });

  res.status(200).json({
    success: true,
    message: '保存成功',
    data: entry,
  });
});

/**
 * GET /api/diary/stats/monthly
 * 获取月度穿搭统计
 */
const getMonthlyStats = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const { year, month } = req.query as { year?: string; month?: string };

  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const currentMonth = month ? parseInt(month) - 1 : new Date().getMonth();

  const stats = await DiaryEntryModel.getMonthlyStats(userId, currentYear, currentMonth + 1);

  res.json({
    success: true,
    message: '获取成功',
    data: stats,
  });
});

router.get('/', listDiary);
router.post('/', validate(createDiarySchema, 'body'), createDiary);
router.post('/upsert', upsertDiary);
router.get('/calendar', getCalendarData);
router.get('/date/:date', getDiaryByDate);
router.get('/stats/monthly', getMonthlyStats);
router.get('/:id', validate(uuidSchema, 'params'), getDiary);
router.put('/:id', validate(uuidSchema, 'params'), validate(updateDiarySchema, 'body'), updateDiary);
router.delete('/:id', validate(uuidSchema, 'params'), deleteDiary);

export default router;
