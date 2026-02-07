/**
 * ==================== 用户模型 (User Repository) ====================
 * 处理用户数据的数据库操作
 */

import { query, queryOne, execute } from '../database';
import { generateId, formatDate } from '../utils/helper';
import { UserAccount } from '../types';
import crypto from 'crypto';

export class UserModel {
  /**
   * 创建新用户
   */
  static async create(email: string, passwordHash: string, username: string): Promise<UserAccount> {
    const id = generateId();
    const now = formatDate();

    await execute(
      `INSERT INTO users (id, email, password_hash, username, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, email, passwordHash, username, now]
    );

    return {
      id,
      email,
      passwordHash,
      username,
      createdAt: now,
    };
  }

  /**
   * 根据邮箱查找用户
   */
  static async findByEmail(email: string): Promise<UserAccount | null> {
    const row = await queryOne<UserAccount & { passwordHash: string }>(
      `SELECT id, email, password_hash as passwordHash, username, created_at as createdAt, last_login_at as lastLoginAt
       FROM users
       WHERE email = ?`,
      [email]
    );
    return row;
  }

  /**
   * 根据ID查找用户
   */
  static async findById(id: string): Promise<UserAccount | null> {
    const row = await queryOne<UserAccount & { passwordHash: string }>(
      `SELECT id, email, password_hash as passwordHash, username, created_at as createdAt, last_login_at as lastLoginAt
       FROM users
       WHERE id = ?`,
      [id]
    );
    return row;
  }

  /**
   * 更新最后登录时间
   */
  static async updateLastLogin(id: string): Promise<void> {
    await execute(
      `UPDATE users
       SET last_login_at = ?
       WHERE id = ?`,
      [formatDate(), id]
    );
  }

  /**
   * 更新用户信息
   */
  static async update(id: string, data: Partial<Pick<UserAccount, 'username' | 'email'>>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.username !== undefined) {
      fields.push('username = ?');
      values.push(data.username);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }

    if (fields.length === 0) return;

    values.push(id);
    await execute(
      `UPDATE users
       SET ${fields.join(', ')}
       WHERE id = ?`,
      values
    );
  }

  /**
   * 删除用户
   */
  static async delete(id: string): Promise<boolean> {
    const result = await execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * 验证密码 (使用简单的哈希比较，生产环境建议使用bcrypt)
   */
  static verifyPassword(password: string, hash: string): boolean {
    return crypto.createHash('sha256').update(password).digest('hex') === hash;
  }

  /**
   * 加密密码
   */
  static hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}

export default UserModel;
