-- ==================== 日记功能数据库表结构设计 ====================
-- 用于腾讯云MySQL数据库

-- ==================== 方案说明 ====================
-- 1. 复用现有 diary_entries 表结构，添加 outfit_id 字段关联搭配
-- 2. 添加索引优化日历查询性能
-- 3. 使用 user_id + date 唯一约束确保每天只有一条记录

-- ==================== 日记条目表 ====================
-- 表名: diary_entries
-- 说明: 存储每日穿搭日记记录

/*
现有表结构（需要修改）：
- id: VARCHAR(36) 主键
- user_id: VARCHAR(36) 用户ID
- date: DATE 日期
- weather: VARCHAR(50) 天气
- mood: VARCHAR(50) 心情
- notes: TEXT 备注
- photo: TEXT 照片URL
- clothing_ids: JSON 服装ID数组
- created_at: DATETIME
- updated_at: DATETIME

需要添加：
- outfit_id: VARCHAR(36) 关联的已保存搭配ID（可选）
- 唯一索引: UNIQUE KEY uk_user_date (user_id, date)
*/

-- 修改现有日记表，添加outfit_id字段和唯一约束
ALTER TABLE diary_entries 
ADD COLUMN IF NOT EXISTS outfit_id VARCHAR(36) DEFAULT NULL COMMENT '关联的已保存搭配ID' AFTER photo,
ADD COLUMN IF NOT EXISTS mood_score INT DEFAULT NULL COMMENT '心情评分1-5' AFTER mood,
ADD UNIQUE KEY IF NOT EXISTS uk_user_date (user_id, date);

-- 优化索引
ALTER TABLE diary_entries 
ADD INDEX IF NOT EXISTS idx_date_range (user_id, date, created_at),
ADD INDEX IF NOT EXISTS idx_outfit (outfit_id);

-- ==================== 日历查询视图（可选） ====================
-- 用于快速获取某月有记录的日期列表

CREATE VIEW IF NOT EXISTS v_diary_calendar AS
SELECT 
    user_id,
    DATE_FORMAT(date, '%Y-%m') as year_month,
    date,
    id as diary_id,
    mood,
    photo IS NOT NULL as has_photo,
    outfit_id IS NOT NULL as has_outfit
FROM diary_entries
WHERE deleted_at IS NULL;

-- ==================== 穿着统计表 ====================
-- 表名: clothing_wear_stats
-- 说明: 缓存每件服装的穿着统计，提高查询性能

CREATE TABLE IF NOT EXISTS clothing_wear_stats (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    clothing_id VARCHAR(36) NOT NULL,
    wear_count INT DEFAULT 0 COMMENT '穿着次数',
    last_worn DATE DEFAULT NULL COMMENT '最后穿着日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_clothing (user_id, clothing_id),
    INDEX idx_wear_count (user_id, wear_count),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (clothing_id) REFERENCES clothing_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服装穿着统计表';

-- ==================== 日记月统计表 ====================
-- 表名: diary_monthly_stats
-- 说明: 缓存每月穿搭统计数据

CREATE TABLE IF NOT EXISTS diary_monthly_stats (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    year_month VARCHAR(7) NOT NULL COMMENT 'YYYY-MM格式',
    total_entries INT DEFAULT 0 COMMENT '日记条目数',
    unique_outfits INT DEFAULT 0 COMMENT '不同搭配数',
    most_frequent_mood VARCHAR(50) DEFAULT NULL COMMENT '最常见心情',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_month (user_id, year_month),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='日记月统计表';

-- ==================== 初始化脚本使用说明 ====================
-- 1. 在腾讯云MySQL控制台或数据库管理工具中执行
-- 2. 确保已先创建users表和clothing_items表
-- 3. 执行顺序：先修改diary_entries表，再创建其他表
