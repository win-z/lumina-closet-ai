-- ==================== Lumina Closet AI 数据库表结构更新 ====================
-- 执行此SQL来创建新表，支持穿着记录和分析结果功能

-- ==================== 1. 穿着记录表 ====================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 2. 分析结果表 ====================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== 索引优化 ====================
-- 为穿着记录添加JSON索引（MySQL 8.0+）
-- ALTER TABLE clothing_records ADD INDEX idx_clothing_ids ((CAST(clothing_ids AS CHAR(36) ARRAY)));

-- ==================== 说明 ====================
-- 1. 穿着记录表(clothing_records):
--    - 记录用户每天的穿着情况
--    - clothing_ids 存储JSON数组，包含当天穿着的衣物ID
--    - 支持按日期和用户查询
--    - 支持统计每件衣服的穿着频率

-- 2. 分析结果表(analysis_results):
--    - 保存AI分析结果和多维度统计数据
--    - 每次分析创建一条新记录
--    - 通过user_id + created_at查询最新结果
--    - 支持历史分析记录回溯

-- 3. 注意事项:
--    - 所有JSON字段在应用层进行序列化/反序列化
--    - 外键约束确保数据一致性
--    - 索引优化查询性能
