/**
 * ==================== 数据库连接层 ====================
 * MySQL数据库适配器
 */

import { logger } from '../utils/logger';
import { getDatabaseAdapter, closeDatabase, query, queryOne, execute } from './adapter';

// 导出便捷函数
export { getDatabaseAdapter, closeDatabase, query, queryOne, execute };
