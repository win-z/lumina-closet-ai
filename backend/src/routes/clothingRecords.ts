/**
 * ==================== 穿着记录路由 ====================
 * 处理穿着记录的CRUD操作
 */

import { Router, Request, Response } from 'express';
import { ClothingRecordModel, ClothingItemModel } from '../models';
import { asyncHandler, Errors } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import { z } from 'zod';

const router = Router();

// 验证schema
const createRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为YYYY-MM-DD'),
  clothingIds: z.array(z.string()).min(1, '至少选择一件衣物'),
  notes: z.string().optional(),
});

const updateRecordSchema = z.object({
  clothingIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/clothing-records
 * 获取穿着记录列表
 */
const listRecords = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { startDate, endDate } = req.query;

  let records;
  if (startDate && endDate) {
    records = await ClothingRecordModel.findByUserIdAndDateRange(
      userId,
      startDate as string,
      endDate as string
    );
  } else {
    records = await ClothingRecordModel.findByUserId(userId);
  }

  // 获取每件衣物的详情
  const recordsWithDetails = await Promise.all(
    records.map(async (record) => {
      const clothingItems = await ClothingItemModel.findByIds(record.clothingIds);
      return { ...record, clothingItems };
    })
  );

  res.json({
    success: true,
    message: '获取成功',
    data: recordsWithDetails,
  });
});

/**
 * GET /api/clothing-records/date/:date
 * 获取特定日期的记录
 */
const getRecordByDate = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;

  const record = await ClothingRecordModel.findByDate(userId, date);
  if (!record) {
    res.json({
      success: true,
      message: '该日期暂无记录',
      data: null,
    });
    return;
  }

  const clothingItems = await ClothingItemModel.findByIds(record.clothingIds);

  res.json({
    success: true,
    message: '获取成功',
    data: { ...record, clothingItems },
  });
});

/**
 * POST /api/clothing-records
 * 创建穿着记录
 */
const createRecord = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const recordData = createRecordSchema.parse(req.body);

  // 验证衣物ID是否属于该用户
  const clothingItems = await ClothingItemModel.findByIds(recordData.clothingIds);
  const validIds = clothingItems.filter((item) => item.userId === userId).map((item) => item.id);

  if (validIds.length !== recordData.clothingIds.length) {
    throw Errors.badRequest('部分衣物不存在或无权访问');
  }

  const record = await ClothingRecordModel.create(userId, {
    date: recordData.date,
    clothingIds: recordData.clothingIds,
    notes: recordData.notes,
  });

  res.status(201).json({
    success: true,
    message: '记录创建成功',
    data: record,
  });
});

/**
 * PUT /api/clothing-records/:id
 * 更新穿着记录
 */
const updateRecord = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const updateData = updateRecordSchema.parse(req.body);

  // 如果有clothingIds，验证所有权
  if (updateData.clothingIds) {
    const clothingItems = await ClothingItemModel.findByIds(updateData.clothingIds);
    const validIds = clothingItems.filter((item) => item.userId === userId).map((item) => item.id);

    if (validIds.length !== updateData.clothingIds.length) {
      throw Errors.badRequest('部分衣物不存在或无权访问');
    }
  }

  const record = await ClothingRecordModel.update(id, userId, updateData);
  if (!record) {
    throw Errors.notFound('记录不存在');
  }

  res.json({
    success: true,
    message: '更新成功',
    data: record,
  });
});

/**
 * DELETE /api/clothing-records/:id
 * 删除穿着记录
 */
const deleteRecord = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const userId = req.user!.userId;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const deleted = await ClothingRecordModel.delete(id, userId);
  if (!deleted) {
    throw Errors.notFound('记录不存在');
  }

  res.json({
    success: true,
    message: '删除成功',
  });
});

/**
 * GET /api/clothing-records/stats
 * 获取穿着统计
 */
const getWearStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const stats = await ClothingRecordModel.getWearStats(userId);

  // 获取衣物详情
  const clothingIds = stats.map((s) => s.clothingId);
  const clothingItems = await ClothingItemModel.findByIds(clothingIds);

  const statsWithDetails = stats.map((stat) => ({
    ...stat,
    clothingItem: clothingItems.find((item) => item.id === stat.clothingId),
  }));

  res.json({
    success: true,
    message: '获取成功',
    data: statsWithDetails,
  });
});

// 路由注册
router.get('/', listRecords);
router.get('/stats', getWearStats);
router.get('/date/:date', getRecordByDate);
router.post('/', createRecord);
router.put('/:id', updateRecord);
router.delete('/:id', deleteRecord);

export default router;
