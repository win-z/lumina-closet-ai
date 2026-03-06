/**
 * 紧急迁移脚本：手动添加 is_archived 字段
 */
import mysql from 'mysql2/promise';

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'gz-cdb-mkay4uxz.sql.tencentcdb.com',
        port: 26857,
        user: 'root',
        password: 'Aa13273956789.0',
        database: 'closet'
    });

    console.log('正在检查 clothing_items 表...');
    const [columns]: any = await connection.query('SHOW COLUMNS FROM clothing_items');
    const hasArchived = columns.some((c: any) => c.Field === 'is_archived');

    if (!hasArchived) {
        console.log('添加 is_archived 字段...');
        await connection.query('ALTER TABLE clothing_items ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0 AFTER wear_count');
        await connection.query('ALTER TABLE clothing_items ADD INDEX idx_archived (user_id, is_archived)');
        console.log('字段添加成功！');
    } else {
        console.log('字段已存在，无需操作。');
    }

    await connection.end();
}

migrate().catch(err => {
    console.error('迁移失败:', err);
    process.exit(1);
});
