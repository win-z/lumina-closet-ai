-- ==================== 修复 photo 字段长度 ====================
-- Base64 图片数据可能很长，需要改为 LONGTEXT

-- 修改 diary_entries 表的 photo 字段
ALTER TABLE diary_entries MODIFY COLUMN photo LONGTEXT DEFAULT NULL;

-- 修改 saved_outfits 表的 tryon_image 字段（如果有的话）
ALTER TABLE saved_outfits MODIFY COLUMN tryon_image LONGTEXT DEFAULT NULL;

SELECT 'photo 字段已修改为 LONGTEXT' as result;
