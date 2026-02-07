/**
 * ==================== MySQL数据库适配器 ====================
 * 仅支持MySQL（腾讯云数据库）
 */

import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface DatabaseAdapter {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ insertId?: number; affectedRows: number }>;
  close(): Promise<void>;
}

/**
 * MySQL 适配器
 */
class MySQLAdapter implements DatabaseAdapter {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: config.database.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    logger.info(`MySQL连接池已创建: ${config.database.host}:${config.database.port}/${config.database.name}`);
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const [rows] = await this.pool.query<mysql.RowDataPacket[]>(sql, params);
      return rows as T[];
    } catch (error) {
      logger.error('MySQL查询失败:', { sql: sql.substring(0, 100), error });
      throw error;
    }
  }

  async queryOne<T>(sql: string, params?: any[]): Promise<T | null> {
    try {
      const [rows] = await this.pool.query<mysql.RowDataPacket[]>(sql, params);
      return (rows as T[])[0] || null;
    } catch (error) {
      logger.error('MySQL查询失败:', { sql: sql.substring(0, 100), error });
      throw error;
    }
  }

  async execute(sql: string, params?: any[]): Promise<{ insertId?: number; affectedRows: number }> {
    try {
      const [result] = await this.pool.execute(sql, params);
      return { 
        insertId: (result as mysql.ResultSetHeader).insertId, 
        affectedRows: (result as mysql.ResultSetHeader).affectedRows 
      };
    } catch (error) {
      logger.error('MySQL执行失败:', { sql: sql.substring(0, 100), error });
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      logger.info('MySQL连接池已关闭');
    }
  }
}

// 单例模式
let adapter: MySQLAdapter | null = null;

export const getDatabaseAdapter = (): MySQLAdapter => {
  if (!adapter) {
    adapter = new MySQLAdapter();
    logger.info(`使用数据库: MySQL (${config.database.host})`);
  }
  return adapter;
};

export const closeDatabase = async (): Promise<void> => {
  if (adapter) {
    await adapter.close();
    adapter = null;
  }
};

// 导出便捷函数
export const query = async <T>(sql: string, params?: any[]): Promise<T[]> => {
  return getDatabaseAdapter().query<T>(sql, params);
};

export const queryOne = async <T>(sql: string, params?: any[]): Promise<T | null> => {
  return getDatabaseAdapter().queryOne<T>(sql, params);
};

export const execute = async (sql: string, params?: any[]): Promise<{ insertId?: number; affectedRows: number }> => {
  return getDatabaseAdapter().execute(sql, params);
};

export default { getDatabaseAdapter, closeDatabase, query, queryOne, execute };
