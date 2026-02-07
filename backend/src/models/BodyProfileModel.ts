/**
 * ==================== 身体档案模型 (BodyProfile Repository) ====================
 * 处理用户身体档案的数据库操作
 */

import { queryOne, execute } from '../database';
import { generateId, formatDate } from '../utils/helper';
import { BodyProfile } from '../types';

export class BodyProfileModel {
  /**
   * 创建新档案
   */
  static async create(userId: string, data: Omit<BodyProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<BodyProfile> {
    const id = generateId();
    const now = formatDate();

    await execute(
      `INSERT INTO body_profiles (id, user_id, name, height_cm, weight_kg, photo_front, photo_side, photo_back, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, data.name, data.heightCm, data.weightKg, data.photoFront || null, data.photoSide || null, data.photoBack || null, data.description || null, now, now]
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
   * 根据用户ID查找档案
   */
  static async findByUserId(userId: string): Promise<BodyProfile | null> {
    const row = await queryOne<BodyProfile>(
      `SELECT id, user_id as userId, name, height_cm as heightCm, weight_kg as weightKg,
              photo_front as photoFront, photo_side as photoSide, photo_back as photoBack,
              description, created_at as createdAt, updated_at as updatedAt
       FROM body_profiles
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    return row;
  }

  /**
   * 根据ID查找档案
   */
  static async findById(id: string): Promise<BodyProfile | null> {
    const row = await queryOne<BodyProfile>(
      `SELECT id, user_id as userId, name, height_cm as heightCm, weight_kg as weightKg,
              photo_front as photoFront, photo_side as photoSide, photo_back as photoBack,
              description, created_at as createdAt, updated_at as updatedAt
       FROM body_profiles
       WHERE id = ?`,
      [id]
    );
    return row;
  }

  /**
   * 更新档案
   */
  static async update(id: string, data: Partial<Omit<BodyProfile, 'id' | 'userId' | 'createdAt'>>): Promise<BodyProfile | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    const now = formatDate();

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.heightCm !== undefined) {
      fields.push('height_cm = ?');
      values.push(data.heightCm);
    }
    if (data.weightKg !== undefined) {
      fields.push('weight_kg = ?');
      values.push(data.weightKg);
    }
    if (data.photoFront !== undefined) {
      fields.push('photo_front = ?');
      values.push(data.photoFront);
    }
    if (data.photoSide !== undefined) {
      fields.push('photo_side = ?');
      values.push(data.photoSide);
    }
    if (data.photoBack !== undefined) {
      fields.push('photo_back = ?');
      values.push(data.photoBack);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }

    if (fields.length === 0) return null;

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await execute(
      `UPDATE body_profiles
       SET ${fields.join(', ')}
       WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  /**
   * 删除档案
   */
  static async delete(id: string): Promise<boolean> {
    const result = await execute('DELETE FROM body_profiles WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export default BodyProfileModel;
