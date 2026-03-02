/**
 * 最终清理脚本
 */
import mysql from 'mysql2/promise';

async function finalCleanup() {
  const connection = await mysql.createConnection({
    host: 'gz-cdb-mkay4uxz.sql.tencentcdb.com',
    port: 26857,
    user: 'root',
    password: 'Aa13273956789.0',
    database: 'closet'
  });

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  
  const tables = ['outfits', 'outfit_details', 'wardrobe_overview', 'outfit_items', 'wear_records', 'wear_record_items'];
  for (const table of tables) {
    try {
      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
      console.log(`已删除: ${table}`);
    } catch (e: any) {
      console.log(`删除失败 ${table}: ${e.message}`);
    }
  }
  
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  const [remaining] = await connection.query('SHOW TABLES');
  console.log('剩余表:', remaining);

  await connection.end();
}

finalCleanup().catch(console.error);
