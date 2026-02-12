-- ==================== 紧急修复脚本 ====================
-- 如果自动迁移失败，请手动在 MySQL 控制台执行此脚本

-- 1. 修复 photo 字段长度（解决图片上传失败问题）
ALTER TABLE diary_entries MODIFY COLUMN photo LONGTEXT DEFAULT NULL;

-- 2. 修复 saved_outfits 表的 tryon_image 字段
ALTER TABLE saved_outfits MODIFY COLUMN tryon_image LONGTEXT DEFAULT NULL;

-- 3. 检查字段是否修改成功
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'diary_entries' 
AND COLUMN_NAME = 'photo';
