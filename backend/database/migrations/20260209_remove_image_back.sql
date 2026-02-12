-- ==================== 移除服装单品背面图片字段 ====================
-- 日期: 2026-02-09
-- 说明: 衣服、裤子、鞋子只需要上传正面照片，不再需要背面照片

-- SQLite 不支持 DROP COLUMN，需要重建表
-- 这里提供兼容方案

-- 方案1: 如果使用的是 MySQL，可以直接删除列
-- ALTER TABLE clothing_items DROP COLUMN image_back;

-- 方案2: 对于 SQLite，可以选择忽略该列（列存在但不使用）
-- 或者重建表（数据迁移）

-- 以下是 SQLite 重建表的方案（如果需要保留数据）
/*
BEGIN TRANSACTION;

-- 创建新表（不含 image_back 列）
CREATE TABLE clothing_items_new (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    image_front TEXT,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    color VARCHAR(50),
    brand VARCHAR(100),
    price DECIMAL(10,2),
    purchase_date DATE,
    tags TEXT,
    last_worn DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 复制数据（不含 image_back）
INSERT INTO clothing_items_new (
    id, user_id, image_front, category, name, color,
    brand, price, purchase_date, tags, last_worn, created_at, updated_at
)
SELECT 
    id, user_id, image_front, category, name, color,
    brand, price, purchase_date, tags, last_worn, created_at, updated_at
FROM clothing_items;

-- 删除旧表
DROP TABLE clothing_items;

-- 重命名新表
ALTER TABLE clothing_items_new RENAME TO clothing_items;

-- 重新创建索引
CREATE INDEX idx_clothing_items_user_id ON clothing_items(user_id);
CREATE INDEX idx_clothing_items_category ON clothing_items(category);

COMMIT;
*/

-- 简单方案：直接在应用层忽略 image_back 字段
-- 数据库中的列可以保留（不影响功能），新插入的数据该列将为 NULL
