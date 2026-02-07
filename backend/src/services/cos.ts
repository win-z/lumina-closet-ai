/**
 * ==================== 腾讯云COS图片上传服务 ====================
 */

import COS from 'cos-nodejs-sdk-v5';
import { config } from '../config';
import { logger } from '../utils/logger';

const cos = new COS({
  SecretId: process.env.TENCENT_COS_SECRET_ID || '',
  SecretKey: process.env.TENCENT_COS_SECRET_KEY || '',
});

const BUCKET = process.env.TENCENT_COS_BUCKET || '5205210-1320011806';
const REGION = process.env.TENCENT_COS_REGION || 'ap-guangzhou';

export interface UploadResult {
  url: string;
  key: string;
}

export class CosService {
  /**
   * 检测base64图片的实际格式
   */
  private static detectImageType(base64Data: string): { type: string; ext: string } {
    // 检查是否包含data URI前缀
    const dataUriMatch = base64Data.match(/^data:image\/([a-zA-Z]+);base64,/);
    if (dataUriMatch) {
      const type = dataUriMatch[1].toLowerCase();
      return { type: `image/${type}`, ext: type };
    }

    // 检查base64开头特征
    const prefix = base64Data.substring(0, 20);
    if (prefix.startsWith('/9j/')) {
      return { type: 'image/jpeg', ext: 'jpg' };
    } else if (prefix.startsWith('iVBORw0KGgo')) {
      return { type: 'image/png', ext: 'png' };
    } else if (prefix.startsWith('R0lGODdh') || prefix.startsWith('R0lGODlh')) {
      return { type: 'image/gif', ext: 'gif' };
    } else if (prefix.startsWith('UklGR')) {
      return { type: 'image/webp', ext: 'webp' };
    }

    // 默认使用jpeg
    return { type: 'image/jpeg', ext: 'jpg' };
  }

  /**
   * 上传Base64图片到COS
   */
  static async uploadBase64Image(base64Data: string, userId: string): Promise<UploadResult> {
    try {
      // 检测图片格式
      const { type, ext } = this.detectImageType(base64Data);
      const filename = `closet/${userId}/${Date.now()}.${ext}`;

      // 去除data URI前缀
      const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      logger.info(`开始上传图片到COS: 格式=${type}, 大小=${buffer.length} bytes`);

      const result = await cos.putObject({
        Bucket: BUCKET,
        Region: REGION,
        Key: filename,
        Body: buffer,
        ContentType: type,
        ACL: 'public-read',
      });

      const url = `https://${BUCKET}.cos.${REGION}.myqcloud.com/${filename}`;

      logger.info('图片上传成功:', { key: filename, url, type, size: buffer.length });

      return { url, key: filename };
    } catch (error) {
      logger.error('COS上传失败:', error);
      throw new Error(`上传图片失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 上传文件流到COS
   */
  static async uploadStream(buffer: Buffer, userId: string, filename: string): Promise<UploadResult> {
    const key = `closet/${userId}/${Date.now()}-${filename}`;

    const result = await cos.putObject({
      Bucket: BUCKET,
      Region: REGION,
      Key: key,
      Body: buffer,
      ACL: 'public-read',  // 设置为公开可读
    });

    const url = `https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`;

    logger.info('图片上传成功:', { key, url });

    return { url, key };
  }

  /**
   * 删除COS图片
   */
  static async deleteImage(key: string): Promise<void> {
    await cos.deleteObject({
      Bucket: BUCKET,
      Region: REGION,
      Key: key,
    });

    logger.info('图片删除成功:', { key });
  }

  /**
   * 获取图片URL
   */
  static getUrl(key: string): string {
    return `https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`;
  }

  /**
   * 从URL下载并上传图片到COS
   */
  static async uploadFromUrl(imageUrl: string, folder: string = 'tryon'): Promise<UploadResult> {
    try {
      logger.info(`从URL下载图片: ${imageUrl}`);
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`下载图片失败: ${response.status}`);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      const filename = `closet/${folder}/${Date.now()}.jpg`;
      
      const result = await cos.putObject({
        Bucket: BUCKET,
        Region: REGION,
        Key: filename,
        Body: buffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      });

      const url = `https://${BUCKET}.cos.${REGION}.myqcloud.com/${filename}`;

      logger.info('URL图片上传成功:', { key: filename, url });

      return { url, key: filename };
    } catch (error) {
      logger.error('URL图片上传COS失败:', error);
      throw new Error(`上传图片失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

export const cosService = new CosService();
export default cosService;
