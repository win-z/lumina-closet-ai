/**
 * ==================== 通用工具函数 ====================
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * 生成唯一ID
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * 格式化日期为MySQL格式
 */
export const formatDate = (date: Date = new Date()): string => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Base64图片数据验证
 */
export const isValidBase64Image = (str: string): boolean => {
  const regex = /^data:image\/(jpeg|png|webp|gif);base64,/;
  return regex.test(str);
};

/**
 * 从Base64提取图片格式
 */
export const getImageMimeType = (base64String: string): string | null => {
  const match = base64String.match(/^data:image\/(\w+);base64,/);
  return match ? `image/${match[1]}` : null;
};

/**
 * 清理Base64前缀
 */
export const cleanBase64Prefix = (base64String: string): string => {
  return base64String.replace(/^data:image\/\w+;base64,/, '');
};

/**
 * 密码强度验证
 */
export const validatePasswordStrength = (password: string): {
  valid: boolean;
  message: string;
} => {
  if (password.length < 8) {
    return { valid: false, message: '密码长度至少8位' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码需要包含大写字母' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码需要包含小写字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码需要包含数字' };
  }
  return { valid: true, message: '密码强度合格' };
};

/**
 * 邮箱格式验证
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * 数组分页
 */
export const paginate = <T>(
  array: T[],
  page: number,
  limit: number
): { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } } => {
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: array.slice(start, end),
    pagination: {
      page,
      limit,
      total: array.length,
      totalPages: Math.ceil(array.length / limit),
    },
  };
};

/**
 * 深度克隆对象
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 随机颜色生成
 */
export const randomColor = (): string => {
  const colors = ['红色', '蓝色', '绿色', '黄色', '紫色', '橙色', '粉色', '黑色', '白色', '灰色', '棕色', '米色'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default {
  generateId,
  formatDate,
  isValidBase64Image,
  getImageMimeType,
  cleanBase64Prefix,
  validatePasswordStrength,
  isValidEmail,
  paginate,
  deepClone,
  debounce,
  randomColor,
};
