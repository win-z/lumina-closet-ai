/**
 * ==================== 分析结果模型 (AnalysisResult Repository) ====================
 * 处理衣橱分析结果的数据库操作
 */

import { query, queryOne, execute } from '../database';
import { generateId, formatDate } from '../utils/helper';
import { AnalysisResult } from '../types';

export class AnalysisResultModel {
  /**
   * 保存分析结果
   */
  static async create(
    userId: string,
    data: Omit<AnalysisResult, 'id' | 'userId' | 'createdAt'>
  ): Promise<AnalysisResult> {
    const id = generateId();
    const now = formatDate();

    await execute(
      `INSERT INTO analysis_results (
        id, user_id, category_stats, color_stats, brand_stats, price_stats, wear_stats, ai_analysis, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        JSON.stringify(data.categoryStats),
        JSON.stringify(data.colorStats),
        JSON.stringify(data.brandStats),
        JSON.stringify(data.priceStats),
        JSON.stringify(data.wearStats),
        data.aiAnalysis || null,
        now,
      ]
    );

    return {
      id,
      userId,
      ...data,
      createdAt: now,
    };
  }

  /**
   * 获取用户最新的分析结果
   */
  static async findLatestByUserId(userId: string): Promise<AnalysisResult | null> {
    const row = await queryOne<
      AnalysisResult & {
        categoryStats: string;
        colorStats: string;
        brandStats: string;
        priceStats: string;
        wearStats: string;
      }
    >(
      `SELECT id, user_id as userId, category_stats as categoryStats, color_stats as colorStats,
              brand_stats as brandStats, price_stats as priceStats, wear_stats as wearStats,
              ai_analysis as aiAnalysis, created_at as createdAt
       FROM analysis_results
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!row) return null;

    return this.mapRowToAnalysisResult(row);
  }

  /**
   * 获取用户的所有分析结果
   */
  static async findByUserId(userId: string, limit = 10): Promise<AnalysisResult[]> {
    const rows = await query<
      AnalysisResult & {
        categoryStats: string;
        colorStats: string;
        brandStats: string;
        priceStats: string;
        wearStats: string;
      }
    >(
      `SELECT id, user_id as userId, category_stats as categoryStats, color_stats as colorStats,
              brand_stats as brandStats, price_stats as priceStats, wear_stats as wearStats,
              ai_analysis as aiAnalysis, created_at as createdAt
       FROM analysis_results
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(row => this.mapRowToAnalysisResult(row));
  }

  /**
   * 删除分析结果
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await execute('DELETE FROM analysis_results WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * 将数据库行映射为AnalysisResult对象
   */
  private static mapRowToAnalysisResult(
    row: AnalysisResult & {
      categoryStats: string;
      colorStats: string;
      brandStats: string;
      priceStats: string;
      wearStats: string;
    }
  ): AnalysisResult {
    return {
      id: row.id,
      userId: row.userId,
      categoryStats: this.safeJsonParse(row.categoryStats),
      colorStats: this.safeJsonParse(row.colorStats),
      brandStats: this.safeJsonParse(row.brandStats),
      priceStats: this.safeJsonParse(row.priceStats),
      wearStats: this.safeJsonParse(row.wearStats),
      aiAnalysis: row.aiAnalysis || undefined,
      createdAt: row.createdAt,
    };
  }

  /**
   * 安全解析JSON
   */
  private static safeJsonParse<T>(value: string | null | undefined): T {
    if (!value) return {} as T;
    try {
      return JSON.parse(value);
    } catch {
      return {} as T;
    }
  }
}

export default AnalysisResultModel;
