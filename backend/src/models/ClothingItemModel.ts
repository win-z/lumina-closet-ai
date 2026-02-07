/**
 * ==================== 服装单品模型 (ClothingItem Repository) ====================
 * 处理服装单品的数据库操作
 */

import { query, queryOne, execute } from '../database';
import { generateId, formatDate } from '../utils/helper';
import { ClothingItem, ClothingCategory } from '../types';

export class ClothingItemModel {
  /**
   * 创建新单品
   */
  static async create(userId: string, data: Omit<ClothingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClothingItem> {
    const id = generateId();
    const now = formatDate();

    await execute(
      `INSERT INTO clothing_items (
         id, user_id, image_front, image_back, category, name, color,
         brand, price, purchase_date, tags, last_worn, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, data.imageFront || null, data.imageBack || null, data.category, data.name, data.color, data.brand || null, data.price || null, data.purchaseDate || null, JSON.stringify(data.tags), data.lastWorn || null, now, now]
    );

    return {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 根据ID查找单品
   */
  static async findById(id: string, userId?: string): Promise<ClothingItem | null> {
    let queryStr = `SELECT id, image_front as imageFront, image_back as imageBack,
            category, name, color, brand, price, purchase_date as purchaseDate,
            tags, last_worn as lastWorn, created_at as createdAt, updated_at as updatedAt
     FROM clothing_items
     WHERE id = ?`;
    const params: unknown[] = [id];

    if (userId) {
      queryStr += ' AND user_id = ?';
      params.push(userId);
    }

    const row = await queryOne<any>(queryStr, params);
    if (!row) return null;

    row.tags = typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []);
    return row;
  }

  /**
   * 根据用户ID获取所有单品
   */
  static async findByUserId(userId: string, options?: {
    category?: ClothingCategory;
    limit?: number;
    offset?: number;
  }): Promise<ClothingItem[]> {
    let queryStr = `SELECT id, image_front as imageFront, image_back as imageBack,
           category, name, color, brand, price, purchase_date as purchaseDate,
           tags, last_worn as lastWorn, created_at as createdAt, updated_at as updatedAt
    FROM clothing_items
    WHERE user_id = ?`;
    const params: unknown[] = [userId];

    if (options?.category) {
      queryStr += ' AND category = ?';
      params.push(options.category);
    }

    queryStr += ' ORDER BY created_at DESC';

    if (options?.limit) {
      queryStr += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options?.offset) {
      queryStr += ' OFFSET ?';
      params.push(options.offset);
    }

    const rows = await query<any>(queryStr, params);

    return rows.map(row => ({
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []),
    }));
  }

  /**
   * 根据ID列表批量获取单品
   */
  static async findByIds(ids: string[]): Promise<(ClothingItem & { userId: string })[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const rows = await query<any>(
      `SELECT id, user_id as userId, image_front as imageFront, image_back as imageBack,
              category, name, color, brand, price, purchase_date as purchaseDate,
              tags, last_worn as lastWorn, created_at as createdAt, updated_at as updatedAt
       FROM clothing_items
       WHERE id IN (${placeholders})`,
      ids
    );

    return rows.map(row => ({
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []),
    }));
  }

  /**
   * 更新单品
   */
  static async update(id: string, userId: string, data: Partial<Omit<ClothingItem, 'id' | 'userId' | 'createdAt'>>): Promise<ClothingItem | null> {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    const fields: string[] = [];
    const values: unknown[] = [];
    const now = formatDate();

    const allowedFields: (keyof typeof data)[] = [
      'imageFront', 'imageBack', 'category', 'name', 'color',
      'brand', 'price', 'purchaseDate', 'tags', 'lastWorn'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        const snakeCase = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeCase} = ?`);
        values.push(field === 'tags' ? JSON.stringify(data[field]) : data[field]);
      }
    }

    if (fields.length === 0) return null;

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    values.push(userId);

    await execute(
      `UPDATE clothing_items
       SET ${fields.join(', ')}
       WHERE id = ? AND user_id = ?`,
      values
    );

    return this.findById(id, userId);
  }

  /**
   * 删除单品
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await execute('DELETE FROM clothing_items WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * 统计用户单品数量
   */
  static async countByUserId(userId: string): Promise<number> {
    const rows = await query<{ count: number }>('SELECT COUNT(*) as count FROM clothing_items WHERE user_id = ?', [userId]);
    return rows[0]?.count || 0;
  }

  /**
   * 更新最后穿着日期
   */
  static async updateLastWorn(id: string, userId: string, date: string): Promise<void> {
    await execute('UPDATE clothing_items SET last_worn = ?, updated_at = ? WHERE id = ? AND user_id = ?', [date, formatDate(), id, userId]);
  }
}

export default ClothingItemModel;
