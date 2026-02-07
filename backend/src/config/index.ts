/**
 * ==================== 后端配置管理 ====================
 * 集中管理所有环境变量和配置项（MySQL + 腾讯云）
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '720', 10),
  },

  // MySQL数据库配置（腾讯云）
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'closet',
  },

  // 硅基流动配置（文本生成）
  siliconflow: {
    apiUrl: process.env.SILICONFLOW_API_URL || 'https://api.siliconflow.cn/v1',
    apiKey: process.env.SILICONFLOW_API_KEY || '',
    model: process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-72B-Instruct-128K',
    visionModel: process.env.SILICONFLOW_VISION_MODEL || 'Qwen/Qwen2.5-VL-32B-Instruct',
  },

  // 豆包配置（图像生成）
  doubao: {
    apiUrl: process.env.DOUBAO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    apiKey: process.env.DOUBAO_API_KEY || '',
    model: process.env.DOUBAO_MODEL || 'doubao-seedream-4-5-251128',
  },

  // CORS配置
  cors: {
    origin: '*',
  },

  // 文件上传配置
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10', 10) * 1024 * 1024,
    allowedTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  },
};

export default config;
