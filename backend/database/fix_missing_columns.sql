-- ==================== 修复 saved_outfits 表结构 ====================
-- 执行此脚本添加缺失的字段

-- 检查并添加 dress_id 字段
SET @dbname = DATABASE();
SET @tablename = 'saved_outfits';
SET @columnname = 'dress_id';

SET @sql = CONCAT(
    'ALTER TABLE ', @tablename, 
    ' ADD COLUMN dress_id VARCHAR(36) DEFAULT NULL AFTER occasion'
);

SET @exists = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = @dbname 
    AND table_name = @tablename 
    AND column_name = @columnname
);

SET @sql = IF(@exists = 0, @sql, 'SELECT "dress_id 字段已存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 top_id 字段
SET @columnname = 'top_id';
SET @sql = CONCAT(
    'ALTER TABLE ', @tablename, 
    ' ADD COLUMN top_id VARCHAR(36) DEFAULT NULL AFTER dress_id'
);
SET @exists = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = @dbname 
    AND table_name = @tablename 
    AND column_name = @columnname
);
SET @sql = IF(@exists = 0, @sql, 'SELECT "top_id 字段已存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 bottom_id 字段
SET @columnname = 'bottom_id';
SET @sql = CONCAT(
    'ALTER TABLE ', @tablename, 
    ' ADD COLUMN bottom_id VARCHAR(36) DEFAULT NULL AFTER top_id'
);
SET @exists = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = @dbname 
    AND table_name = @tablename 
    AND column_name = @columnname
);
SET @sql = IF(@exists = 0, @sql, 'SELECT "bottom_id 字段已存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 shoes_id 字段
SET @columnname = 'shoes_id';
SET @sql = CONCAT(
    'ALTER TABLE ', @tablename, 
    ' ADD COLUMN shoes_id VARCHAR(36) DEFAULT NULL AFTER bottom_id'
);
SET @exists = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = @dbname 
    AND table_name = @tablename 
    AND column_name = @columnname
);
SET @sql = IF(@exists = 0, @sql, 'SELECT "shoes_id 字段已存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 outfit_id 到 diary_entries 表
SET @tablename = 'diary_entries';
SET @columnname = 'outfit_id';
SET @sql = CONCAT(
    'ALTER TABLE ', @tablename, 
    ' ADD COLUMN outfit_id VARCHAR(36) DEFAULT NULL AFTER photo'
);
SET @exists = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = @dbname 
    AND table_name = @tablename 
    AND column_name = @columnname
);
SET @sql = IF(@exists = 0, @sql, 'SELECT "outfit_id 字段已存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '修复完成' as result;
