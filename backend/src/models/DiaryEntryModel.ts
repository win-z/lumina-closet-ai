/**
 * ==================== 日记条目模型 (DiaryEntry Repository) ====================
 * 处理穿搭日记的数据库操作
 */

import { query, queryOne, execute } from '../database';
import { generateId, formatDate } from '../utils/helper';
import { DiaryEntry } from '../types';

export class DiaryEntryModel {
  /**
   * 创建新日记
   */
  static async create(userId: string, data: Omit<DiaryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<DiaryEntry> {
    const id = generateId();
    const now = formatDate();

    await execute(
      `INSERT INTO diary_entries (
        id, user_id, date, weather, mood, notes, photo, clothing_ids, outfit_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, data.date, data.weather, data.mood, data.notes || null, data.photo || null, JSON.stringify(data.clothingIds), data.outfitId || null, now, now]
    );

    return {
      id,
      userId,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 根据ID查找日记
   */
  static async findById(id: string, userId?: string): Promise<DiaryEntry | null> {
    let queryStr = `SELECT id, user_id as userId, date, weather, mood, notes, photo,
            clothing_ids, created_at as createdAt, updated_at as updatedAt
     FROM diary_entries
     WHERE id = ?`;
    const params: unknown[] = [id];

    if (userId) {
      queryStr += ' AND user_id = ?';
      params.push(userId);
    }

    const row = await queryOne<DiaryEntry & { clothingIds: string }>(queryStr, params);
    if (!row) return null;

    row.clothingIds = JSON.parse(row.clothingIds || '[]');
    return row;
  }

  /**
   * 根据用户ID获取所有日记（可分页）
   */
  static async findByUserId(userId: string, options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'date' | 'createdAt';
    order?: 'ASC' | 'DESC';
  }): Promise<DiaryEntry[]> {
    let queryStr = `SELECT id, user_id as userId, date, weather, mood, notes, photo, outfit_id,
            clothing_ids, created_at as createdAt, updated_at as updatedAt
     FROM diary_entries
     WHERE user_id = ?`;
    const params: unknown[] = [userId];

    if (options?.startDate) {
      queryStr += ' AND date >= ?';
      params.push(options.startDate);
    }
    if (options?.endDate) {
      queryStr += ' AND date <= ?';
      params.push(options.endDate);
    }

    const orderBy = options?.orderBy || 'date';
    const order = options?.order || 'DESC';
    queryStr += ` ORDER BY ${orderBy} ${order}`;

    if (options?.limit) {
      queryStr += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options?.offset) {
      queryStr += ' OFFSET ?';
      params.push(options.offset);
    }

    const rows = await query<DiaryEntry & { clothingIds: string; outfitId?: string }>(queryStr, params);

    return rows.map(row => ({
      ...row,
      clothingIds: JSON.parse(row.clothingIds || '[]'),
      outfitId: row.outfitId,
    }));
  }

  /**
   * 根据用户ID和日期查找日记（唯一）
   */
  static async findByDate(userId: string, date: string): Promise<DiaryEntry | null> {
    const queryStr = `SELECT id, user_id as userId, date, weather, mood, notes, photo, outfit_id,
            clothing_ids, created_at as createdAt, updated_at as updatedAt
     FROM diary_entries
     WHERE user_id = ? AND date = ?`;

    const row = await queryOne<DiaryEntry & { clothingIds: string; outfitId?: string }>(queryStr, [userId, date]);
    if (!row) return null;

    return {
      ...row,
      clothingIds: JSON.parse(row.clothingIds || '[]'),
      outfitId: row.outfitId,
    };
  }

  /**
   * 创建或更新日记（UPSERT）
   * 如果该日期已有记录则更新，否则创建
   */
  static async upsert(userId: string, data: {
    date: string;
    weather?: string;
    mood?: string;
    notes?: string;
    photo?: string;
    clothingIds?: string[];
    outfitId?: string;
  }): Promise<DiaryEntry> {
    // 先查找是否已存在
    const existing = await this.findByDate(userId, data.date);

    if (existing) {
      // 更新现有记录
      const updateData: Partial<DiaryEntry> = {};
      if (data.weather !== undefined) updateData.weather = data.weather;
      if (data.mood !== undefined) updateData.mood = data.mood;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.photo !== undefined) updateData.photo = data.photo;
      if (data.clothingIds !== undefined) updateData.clothingIds = data.clothingIds;
      if (data.outfitId !== undefined) (updateData as any).outfitId = data.outfitId;

      const updated = await this.update(existing.id, userId, updateData);
      if (!updated) throw new Error('更新日记失败');
      return updated;
    } else {
      // 创建新记录
      return this.create(userId, {
        date: data.date,
        weather: data.weather || '',
        mood: data.mood || '',
        notes: data.notes || '',
        photo: data.photo,
        clothingIds: data.clothingIds || [],
        outfitId: data.outfitId,
      });
    }
  }

  /**
   * 获取某月有日记的日期列表（用于日历标记）
   */
  static async getDatesByMonth(userId: string, year: number, month: number): Promise<{
    date: string;
    hasPhoto: boolean;
    hasOutfit: boolean;
    mood?: string;
  }[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const rows = await query<{
      date: string;
      photo: string | null;
      outfit_id: string | null;
      mood: string;
    }>(
      `SELECT date, photo, outfit_id, mood FROM diary_entries
       WHERE user_id = ? AND date >= ? AND date < ?
       ORDER BY date`,
      [userId, startDate, endDate]
    );

    return rows.map(row => {
      // 确保日期格式为 YYYY-MM-DD
      const dateObj = new Date(row.date);
      const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      return {
        date: formattedDate,
        hasPhoto: !!row.photo,
        hasOutfit: !!row.outfit_id,
        mood: row.mood || undefined,
      };
    });
  }

  /**
   * 统计用户日记数量
   */
  static async countByUserId(userId: string): Promise<number> {
    const rows = await query<{ count: number }>('SELECT COUNT(*) as count FROM diary_entries WHERE user_id = ?', [userId]);
    return rows[0]?.count || 0;
  }

  /**
   * 更新日记
   */
  static async update(id: string, userId: string, data: Partial<Omit<DiaryEntry, 'id' | 'userId' | 'createdAt'>>): Promise<DiaryEntry | null> {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    const fields: string[] = [];
    const values: unknown[] = [];
    const now = formatDate();

    const allowedFields: (keyof typeof data)[] = [
      'date', 'weather', 'mood', 'notes', 'photo', 'clothingIds', 'outfitId'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        const snakeCase = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeCase} = ?`);
        values.push(field === 'clothingIds' ? JSON.stringify(data[field]) : data[field]);
      }
    }

    if (fields.length === 0) return null;

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    values.push(userId);

    await execute(
      `UPDATE diary_entries
       SET ${fields.join(', ')}
       WHERE id = ? AND user_id = ?`,
      values
    );

    return this.findById(id, userId);
  }

  /**
   * 删除日记
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await execute('DELETE FROM diary_entries WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * 获取某日穿搭最多的单品ID
   */
  static async getMostWornClothing(userId: string, limit: number = 5): Promise<{ clothingId: string; count: number }[]> {
    const rows = await query<{ clothingId: string; count: number }>(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(clothing_ids, CONCAT('$[', numbers.n, ']'))) as clothingId, COUNT(*) as count
       FROM diary_entries,
       (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) as numbers
       WHERE diary_entries.user_id = ?
         AND numbers.n < JSON_LENGTH(clothing_ids)
       GROUP BY clothingId
       ORDER BY count DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  }

  /**
   * 获取某月穿搭统计
   */
  static async getMonthlyStats(userId: string, year: number, month: number): Promise<{
    totalEntries: number;
    uniqueOutfits: number;
    avgMood: string;
  }> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const statsRows = await query<{ totalEntries: number; uniqueOutfits: number }>(
      `SELECT COUNT(*) as totalEntries, COUNT(DISTINCT clothing_ids) as uniqueOutfits
       FROM diary_entries
       WHERE user_id = ? AND date >= ? AND date < ?`,
      [userId, startDate, endDate]
    );
    const stats = statsRows[0] || { totalEntries: 0, uniqueOutfits: 0 };

    const moodRows = await query<{ mood: string }>(
      `SELECT mood, COUNT(*) as count
       FROM diary_entries
       WHERE user_id = ? AND date >= ? AND date < ?
       GROUP BY mood
       ORDER BY count DESC
       LIMIT 1`,
      [userId, startDate, endDate]
    );
    const moodResult = moodRows[0];

    return {
      totalEntries: stats.totalEntries,
      uniqueOutfits: stats.uniqueOutfits,
      avgMood: moodResult?.mood || '',
    };
  }
}

export default DiaryEntryModel;
