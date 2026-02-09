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
   * 获取用户在日期范围内的记录
   */
  static async findByUserIdAndDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ClothingRecord[]> {
    const rows = await query<ClothingRecord & { clothingIds: string }>(
      `SELECT id, user_id as userId, date, clothing_ids as clothingIds, notes, created_at as createdAt, updated_at as updatedAt
       FROM clothing_records
       WHERE user_id = ? AND date >= ? AND date <= ?
       ORDER BY date DESC`,
      [userId, startDate, endDate]
    );

    return rows.map(row => this.mapRowToClothingRecord(row));
  }

  /**
   * 获取用户所有记录
   */
  static async findByUserId(userId: string): Promise<ClothingRecord[]> {
    const rows = await query<ClothingRecord & { clothingIds: string }>(
      `SELECT id, user_id as userId, date, clothing_ids as clothingIds, notes, created_at as createdAt, updated_at as updatedAt
       FROM clothing_records
       WHERE user_id = ?
       ORDER BY date DESC`,
      [userId]
    );

    return rows.map(row => this.mapRowToClothingRecord(row));
  }

  /**
   * 获取特定日期的记录
   */
  static async findByDate(userId: string, date: string): Promise<ClothingRecord | null> {
    const row = await queryOne<ClothingRecord & { clothingIds: string }>(
      `SELECT id, user_id as userId, date, clothing_ids as clothingIds, notes, created_at as createdAt, updated_at as updatedAt
       FROM clothing_records
       WHERE user_id = ? AND date = ?`,
      [userId, date]
    );

    if (!row) return null;
    return this.mapRowToClothingRecord(row);
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
   * 获取穿着统计
   */
  static async getWearStats(userId: string): Promise<ClothingWearStats[]> {
    const rows = await query<{ clothingId: string; wearCount: number; lastWorn: string }>(
      `SELECT 
        json_each.value as clothingId,
        COUNT(*) as wearCount,
        MAX(date) as lastWorn
       FROM clothing_records, json_each(clothing_records.clothing_ids)
       WHERE user_id = ?
       GROUP BY json_each.value
       ORDER BY wearCount DESC`,
      [userId]
    );

    return rows;
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
