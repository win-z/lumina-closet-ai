/**
 * ==================== 穿着记录模型 (ClothingRecord Repository) ====================
 * 处理穿着记录的数据库操作
 */

import { query, queryOne, execute } from '../database';
import { generateId, formatDate } from '../utils/helper';
import { ClothingRecord, ClothingWearStats } from '../types';

export class ClothingRecordModel {
  /**
   * 创建穿着记录
   */
  static async create(userId: string, data: { date: string; clothingIds: string[]; notes?: string }): Promise<ClothingRecord> {
    const id = generateId();
    const now = formatDate();

    await execute(
      `INSERT INTO clothing_records (
        id, user_id, date, clothing_ids, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        data.date,
        JSON.stringify(data.clothingIds),
        data.notes || null,
        now,
        now,
      ]
    );

    // 更新服装的最后穿着日期
    for (const clothingId of data.clothingIds) {
      await execute(
        'UPDATE clothing_items SET last_worn = ?, updated_at = ? WHERE id = ? AND user_id = ?',
        [data.date, now, clothingId, userId]
      );
    }

    return {
      id,
      userId,
      date: data.date,
      clothingIds: data.clothingIds,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 根据ID查找记录
   */
  static async findById(id: string, userId?: string): Promise<ClothingRecord | null> {
    let queryStr = `SELECT id, user_id as userId, date, clothing_ids as clothingIds, notes, created_at as createdAt, updated_at as updatedAt
     FROM clothing_records
     WHERE id = ?`;
    const params: unknown[] = [id];

    if (userId) {
      queryStr += ' AND user_id = ?';
      params.push(userId);
    }

    const row = await queryOne<ClothingRecord & { clothingIds: string }>(queryStr, params);
    if (!row) return null;

    return this.mapRowToClothingRecord(row);
  }

  /**
   * 获取用户在日期范围内的记录（按日期分组，每日期只取最新更新的记录）
   */
  static async findByUserIdAndDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ClothingRecord[]> {
    // 先查询日期范围内的所有记录
    const allRows = await query<ClothingRecord & { clothingIds: string }>(
      `SELECT id, user_id as userId, date, clothing_ids as clothingIds, notes, created_at as createdAt, updated_at as updatedAt
       FROM clothing_records
       WHERE user_id = ? AND date >= ? AND date <= ?
       ORDER BY date DESC, updated_at DESC`,
      [userId, startDate, endDate]
    );

    // 按日期分组，每日期只取最新更新的记录
    const latestByDate = new Map<string, ClothingRecord & { clothingIds: string }>();
    for (const row of allRows) {
      if (!latestByDate.has(row.date)) {
        latestByDate.set(row.date, row);
      }
    }

    return Array.from(latestByDate.values())
      .map(row => this.mapRowToClothingRecord(row))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  /**
   * 获取用户所有记录（按日期分组，每日期只取最新更新的记录）
   */
  static async findByUserId(userId: string): Promise<ClothingRecord[]> {
    const allRows = await query<ClothingRecord & { clothingIds: string }>(
      `SELECT id, user_id as userId, date, clothing_ids as clothingIds, notes, created_at as createdAt, updated_at as updatedAt
       FROM clothing_records
       WHERE user_id = ?
       ORDER BY date DESC, updated_at DESC`,
      [userId]
    );

    // 按日期分组，每日期只取最新更新的记录
    const latestByDate = new Map<string, ClothingRecord & { clothingIds: string }>();
    for (const row of allRows) {
      const dateKey = String(row.date);
      if (!latestByDate.has(dateKey)) {
        latestByDate.set(dateKey, row);
      }
    }

    return Array.from(latestByDate.values())
      .map(row => this.mapRowToClothingRecord(row))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  /**
   * 获取特定日期的记录（如果有多个，取最新更新的）
   */
  static async findByDate(userId: string, date: string): Promise<ClothingRecord | null> {
    const rows = await query<ClothingRecord & { clothingIds: string }>(
      `SELECT id, user_id as userId, date, clothing_ids as clothingIds, notes, created_at as createdAt, updated_at as updatedAt
       FROM clothing_records
       WHERE user_id = ? AND date = ?
       ORDER BY updated_at DESC`,
      [userId, date]
    );

    if (rows.length === 0) return null;
    return this.mapRowToClothingRecord(rows[0]);
  }

  /**
   * 更新记录
   */
  static async update(
    id: string,
    userId: string,
    data: { clothingIds?: string[]; notes?: string }
  ): Promise<ClothingRecord | null> {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    const fields: string[] = [];
    const values: unknown[] = [];
    const now = formatDate();

    if (data.clothingIds !== undefined) {
      fields.push('clothing_ids = ?');
      values.push(JSON.stringify(data.clothingIds));
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }

    if (fields.length === 0) return null;

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    values.push(userId);

    await execute(
      `UPDATE clothing_records SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    return this.findById(id, userId);
  }

  /**
   * 删除记录
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await execute('DELETE FROM clothing_records WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }

  /**
    * 获取穿着统计（兼容旧版MySQL，不用json_each）
    */
   static async getWearStats(userId: string): Promise<ClothingWearStats[]> {
     // 先获取所有记录，然后在代码中解析JSON
     const rows = await query<{ id: string; clothing_ids: string; date: string }>(
       `SELECT id, clothing_ids, date FROM clothing_records WHERE user_id = ?`,
       [userId]
     );

     // 统计每件衣服的穿着次数
     const statsMap = new Map<string, { count: number; lastWorn: string }>();

     for (const row of rows) {
       const clothingIds = this.safeJsonParse(row.clothing_ids);
       for (const clothingId of clothingIds) {
         const existing = statsMap.get(clothingId);
         if (existing) {
           existing.count += 1;
           if (row.date > existing.lastWorn) {
             existing.lastWorn = row.date;
           }
         } else {
           statsMap.set(clothingId, { count: 1, lastWorn: row.date });
         }
       }
     }

     // 转换为数组并排序
     return Array.from(statsMap.entries()).map(([clothingId, data]) => ({
       clothingId,
       wearCount: data.count,
       lastWorn: data.lastWorn,
     })).sort((a, b) => b.wearCount - a.wearCount);
   }

  /**
   * 将数据库行映射为ClothingRecord对象
   */
  private static mapRowToClothingRecord(row: ClothingRecord & { clothingIds: string }): ClothingRecord {
    return {
      id: row.id,
      userId: row.userId,
      date: row.date,
      clothingIds: this.safeJsonParse(row.clothingIds),
      notes: row.notes || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * 安全解析JSON
   */
  private static safeJsonParse(value: string | null | undefined): string[] {
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
}

export default ClothingRecordModel;
