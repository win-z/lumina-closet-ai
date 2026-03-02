/**
 * 检查表结构
 */
import mysql from 'mysql2/promise';

async function checkTable() {
  const connection = await mysql.createConnection({
    host: 'gz-cdb-mkay4uxz.sql.tencentcdb.com',
    port: 26857,
    user: 'root',
    password: 'Aa13273956789.0',
    database: 'closet'
  });

  const [columns] = await connection.query('SHOW COLUMNS FROM clothing_items');
  console.log('clothing_items 表结构:');
  console.log(columns);

  await connection.end();
}

checkTable().catch(console.error);
