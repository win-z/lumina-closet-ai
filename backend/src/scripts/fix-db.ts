/**
 * 修复数据库表字段
 */
import mysql from 'mysql2/promise';

async function fixTable() {
  const connection = await mysql.createConnection({
    host: 'gz-cdb-mkay4uxz.sql.tencentcdb.com',
    port: 26857,
    user: 'root',
    password: 'Aa13273956789.0',
    database: 'closet'
  });

  // 修改字段允许NULL和默认值
  const fields = ['colors', 'seasons', 'occasions', 'styles'];
  
  for (const field of fields) {
    try {
      await connection.query(`ALTER TABLE clothing_items MODIFY ${field} TEXT NULL DEFAULT NULL`);
      console.log(`已修复: ${field}`);
    } catch (e: any) {
      console.log(`失败: ${field} - ${e.message}`);
    }
  }

  // 验证
  const [columns] = await connection.query('SHOW COLUMNS FROM clothing_items WHERE Field IN ("colors", "seasons", "occasions", "styles")');
  console.log('修复后:', columns);

  await connection.end();
}

fixTable().catch(console.error);
