/**
 * ==================== 已保存搭配模型 (SavedOutfit Repository) ====================
 * 处理已保存穿搭的数据库操作
 */

import { query, queryOne, execute } from '../database';
import { generateId, formatDate } from '../utils/helper';
import { SavedOutfit } from '../types';

export class SavedOutfitModel {
  /**
   * 创建新搭配
   */
  static async create(userId: string, data: Omit<SavedOutfit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<SavedOutfit> {
    const id = generateId();
    const now = formatDate();

    await execute(
      `INSERT INTO saved_outfits (
        id, user_id, name, tags, weather, occasion, dress_id, top_id, bottom_id, shoes_id,
        reasoning, tryon_image, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        data.name || null,
        JSON.stringify(data.tags || []),
        data.weather || null,
        data.occasion || null,
        data.dressId || null,
        data.topId || null,
        data.bottomId || null,
        data.shoesId || null,
        data.reasoning || null,
        data.tryonImage || null,
        now,
        now,
      ]
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
   * 根据ID查找搭配
   */
  static async findById(id: string, userId?: string): Promise<SavedOutfit | null> {
    let queryStr = `SELECT id, user_id as userId, name, tags, weather, occasion,
            dress_id as dressId, top_id as topId, bottom_id as bottomId, shoes_id as shoesId,
            reasoning, tryon_image as tryonImage, created_at as createdAt, updated_at as updatedAt
     FROM saved_outfits
     WHERE id = ?`;
    const params: unknown[] = [id];

    if (userId) {
      queryStr += ' AND user_id = ?';
      params.push(userId);
    }

    const row = await queryOne<SavedOutfit & { tags: string }>(queryStr, params);
    if (!row) return null;

    return this.mapRowToSavedOutfit(row);
  }

  /**
   * 获取用户所有已保存搭配
   */
  static async findByUserId(userId: string): Promise<SavedOutfit[]> {
    const rows = await query<SavedOutfit & { tags: string }>(
      `SELECT id, user_id as userId, name, tags, weather, occasion,
              dress_id as dressId, top_id as topId, bottom_id as bottomId, shoes_id as shoesId,
              reasoning, tryon_image as tryonImage, created_at as createdAt, updated_at as updatedAt
       FROM saved_outfits
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return rows.map(row => this.mapRowToSavedOutfit(row));
  }

  /**
   * 将数据库行映射为SavedOutfit对象
   */
  private static mapRowToSavedOutfit(row: SavedOutfit & { tags: string }): SavedOutfit {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name || undefined,
      tags: this.safeJsonParse(row.tags),
      weather: row.weather || undefined,
      occasion: row.occasion || undefined,
      dressId: row.dressId || undefined,
      topId: row.topId || undefined,
      bottomId: row.bottomId || undefined,
      shoesId: row.shoesId || undefined,
      reasoning: row.reasoning || undefined,
      tryonImage: row.tryonImage || undefined,
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

  /**
   * 更新搭配
   */
  static async update(id: string, userId: string, data: Partial<Omit<SavedOutfit, 'id' | 'userId' | 'createdAt'>>): Promise<SavedOutfit | null> {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    const fields: string[] = [];
    const values: unknown[] = [];
    const now = formatDate();

    const allowedFields = ['name', 'tags', 'weather', 'occasion', 'dressId', 'topId', 'bottomId', 'shoesId', 'reasoning', 'tryonImage'];

    for (const field of allowedFields) {
      const value = data[field as keyof typeof data];
      if (value !== undefined) {
        const snakeCase = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeCase} = ?`);
        values.push(field === 'tags' ? JSON.stringify(value) : value);
      }
    }

    if (fields.length === 0) return null;

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    values.push(userId);

    await execute(
      `UPDATE saved_outfits SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    return this.findById(id, userId);
  }

  /**
   * 删除搭配
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await execute('DELETE FROM saved_outfits WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * 统计用户保存的搭配数量
   */
  static async countByUserId(userId: string): Promise<number> {
    const rows = await query<{ count: number }>('SELECT COUNT(*) as count FROM saved_outfits WHERE user_id = ?', [userId]);
    return rows[0]?.count || 0;
  }
}

export default SavedOutfitModel;
