-- ==================== 添加连衣裙支持 ====================
-- 为 saved_outfits 表添加 dress_id 字段

-- 检查并添加 dress_id 字段
SET @dbname = DATABASE();
SET @tablename = 'saved_outfits';
SET @columnname = 'dress_id';

SET @sql = CONCAT(
  'ALTER TABLE ', @tablename,
  ' ADD COLUMN ', @columnname, ' VARCHAR(36) NULL AFTER occasion'
);

SET @exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = @dbname
    AND table_name = @tablename
    AND column_name = @columnname
);

SET @query := IF(@exists = 0, @sql, 'SELECT \'Column already exists\' as message');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加外键约束（可选，如果 clothing_items 表存在）
-- ALTER TABLE saved_outfits
-- ADD CONSTRAINT fk_saved_outfits_dress
-- FOREIGN KEY (dress_id) REFERENCES clothing_items(id)
-- ON DELETE SET NULL;
