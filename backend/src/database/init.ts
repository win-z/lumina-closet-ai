/**
 * ==================== 数据库初始化 ====================
 * 自动创建必要的表结构
 */

import { logger } from '../utils/logger';
import { execute, query } from './adapter';

/**
 * 初始化数据库表
 */
export const initDatabase = async (): Promise<void> => {
  try {
    logger.info('开始初始化数据库表...');

    // 检查 users 表是否存在（基础表）
    const tables = await query<{ table_name: string }>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);

    const existingTables = tables.map(t => t.table_name);
    logger.info('现有表:', existingTables);

    // 创建 clothing_records 表
    if (!existingTables.includes('clothing_records')) {
      logger.info('创建 clothing_records 表...');
      await execute(`
        CREATE TABLE IF NOT EXISTS clothing_records (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          date DATE NOT NULL,
          clothing_ids JSON NOT NULL,
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_date (user_id, date),
          INDEX idx_date (date),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      logger.info('clothing_records 表创建成功');
    } else {
      logger.info('clothing_records 表已存在');
    }

    // 创建 analysis_results 表
    if (!existingTables.includes('analysis_results')) {
      logger.info('创建 analysis_results 表...');
      await execute(`
        CREATE TABLE IF NOT EXISTS analysis_results (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          category_stats JSON,
          color_stats JSON,
          brand_stats JSON,
          price_stats JSON,
          wear_stats JSON,
          ai_analysis TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_created (user_id, created_at),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      logger.info('analysis_results 表创建成功');
    } else {
      logger.info('analysis_results 表已存在');
    }

    // 创建 saved_outfits 表
    if (!existingTables.includes('saved_outfits')) {
      logger.info('创建 saved_outfits 表...');
      await execute(`
        CREATE TABLE IF NOT EXISTS saved_outfits (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          name VARCHAR(100) DEFAULT NULL,
          tags JSON DEFAULT NULL,
          weather VARCHAR(50) DEFAULT NULL,
          occasion VARCHAR(100) DEFAULT NULL,
          dress_id VARCHAR(36) DEFAULT NULL,
          top_id VARCHAR(36) DEFAULT NULL,
          bottom_id VARCHAR(36) DEFAULT NULL,
          shoes_id VARCHAR(36) DEFAULT NULL,
          reasoning TEXT DEFAULT NULL,
          tryon_image TEXT DEFAULT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user (user_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      logger.info('saved_outfits 表创建成功');
    } else {
      logger.info('saved_outfits 表已存在');
    }

    logger.info('数据库初始化完成');

    // 修复：检查并添加缺失的字段
    await fixMissingColumns();
  } catch (error) {
    logger.error('数据库初始化失败:', error);
    // 不抛出错误，让应用继续启动
  }
};

/**
 * 修复缺失的字段
 */
async function fixMissingColumns() {
  try {
    // 获取当前数据库名
    const dbResult = await query<{ DATABASE(): string }>('SELECT DATABASE()');
    const dbName = dbResult[0]?.['DATABASE()'];
    
    // 检查 saved_outfits 表的字段
    const savedOutfitColumns = await query<{ column_name: string }>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = ? AND table_name = 'saved_outfits'
    `, [dbName]);
    
    const savedOutfitColumnNames = savedOutfitColumns.map(c => c.column_name);
    
    // 逐个添加缺失的字段
    if (!savedOutfitColumnNames.includes('dress_id')) {
      logger.info('添加 dress_id 字段...');
      await execute(`ALTER TABLE saved_outfits ADD COLUMN dress_id VARCHAR(36) DEFAULT NULL AFTER occasion`);
    }
    
    if (!savedOutfitColumnNames.includes('top_id')) {
      logger.info('添加 top_id 字段...');
      await execute(`ALTER TABLE saved_outfits ADD COLUMN top_id VARCHAR(36) DEFAULT NULL AFTER dress_id`);
    }
    
    if (!savedOutfitColumnNames.includes('bottom_id')) {
      logger.info('添加 bottom_id 字段...');
      await execute(`ALTER TABLE saved_outfits ADD COLUMN bottom_id VARCHAR(36) DEFAULT NULL AFTER top_id`);
    }
    
    if (!savedOutfitColumnNames.includes('shoes_id')) {
      logger.info('添加 shoes_id 字段...');
      await execute(`ALTER TABLE saved_outfits ADD COLUMN shoes_id VARCHAR(36) DEFAULT NULL AFTER bottom_id`);
    }

    // 检查 diary_entries 表的字段
    const diaryColumns = await query<{ column_name: string }>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = ? AND table_name = 'diary_entries'
    `, [dbName]);
    
    const diaryColumnNames = diaryColumns.map(c => c.column_name);
    
    if (!diaryColumnNames.includes('outfit_id')) {
      logger.info('添加 outfit_id 字段到 diary_entries...');
      await execute(`ALTER TABLE diary_entries ADD COLUMN outfit_id VARCHAR(36) DEFAULT NULL AFTER photo`);
    }
    
    // 修复 photo 字段长度为 LONGTEXT
    const photoColumn = await query<{ DATA_TYPE: string }>(`
      SELECT DATA_TYPE 
      FROM information_schema.columns 
      WHERE table_schema = ? AND table_name = 'diary_entries' AND column_name = 'photo'
    `, [dbName]);
    
    if (photoColumn.length > 0 && photoColumn[0].DATA_TYPE !== 'longtext') {
      logger.info('修复 photo 字段长度为 LONGTEXT...');
      await execute(`ALTER TABLE diary_entries MODIFY COLUMN photo LONGTEXT DEFAULT NULL`);
      logger.info('photo 字段修复完成');
    }
    
    // 检查并添加索引
    const diaryIndexes = await query<{ INDEX_NAME: string }>(`
      SELECT INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'diary_entries'
    `, [dbName]);
    
    const indexNames = diaryIndexes.map(i => i.INDEX_NAME);
    
    if (!indexNames.includes('uk_user_date')) {
      try {
        await execute(`ALTER TABLE diary_entries ADD UNIQUE KEY uk_user_date (user_id, date)`);
        logger.info('添加 uk_user_date 索引成功');
      } catch (e) {
        logger.warn('唯一索引添加失败（可能已存在或数据冲突）');
      }
    }
    
    if (!indexNames.includes('idx_date_range')) {
      try {
        await execute(`ALTER TABLE diary_entries ADD INDEX idx_date_range (user_id, date, created_at)`);
        logger.info('添加 idx_date_range 索引成功');
      } catch (e) {
        logger.warn('日期范围索引添加失败');
      }
    }
    
    if (!indexNames.includes('idx_outfit')) {
      try {
        await execute(`ALTER TABLE diary_entries ADD INDEX idx_outfit (outfit_id)`);
        logger.info('添加 idx_outfit 索引成功');
      } catch (e) {
        logger.warn('outfit索引添加失败');
      }
    }
    
    logger.info('字段修复完成');
  } catch (error) {
    logger.error('修复字段失败:', error);
  }
}

export default initDatabase;
