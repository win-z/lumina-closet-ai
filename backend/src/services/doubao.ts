/**
 * ==================== 豆包(Doubao) 虚拟试穿服务 ====================
 * 使用 Seedream 4.5 多图参考生成功能实现虚拟试穿
 * 
 * 输入：
 * - 用户照片（正面、侧面、背面）
 * - 服装照片（上装正反面、下装正反面、鞋履）
 * 
 * 输出：试穿效果图
 */

import { config } from '../config';
import { logger } from '../utils/logger';
import { BodyProfile, ClothingItem } from '../types';

interface DoubaoImageResponse {
  data: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

export class DoubaoService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiKey = config.doubao.apiKey;
    this.apiUrl = config.doubao.apiUrl;
    this.model = config.doubao.model;
  }

  /**
   * 生成虚拟试穿照片
   * 使用多张参考图（用户照片 + 服装照片）
   */
  async generateVirtualTryOn(
    profile: BodyProfile,
    top?: ClothingItem,
    bottom?: ClothingItem,
    shoes?: ClothingItem,
    occasion: string = '日常'
  ): Promise<string> {
    logger.info('开始生成虚拟试穿...');

    // 收集所有参考图片URL
    const referenceImages: string[] = [];

    // 添加用户照片（正面、侧面、背面）
    if (profile.photoFront) {
      referenceImages.push(profile.photoFront);
      logger.info('添加用户正面照片');
    }
    if (profile.photoSide) {
      referenceImages.push(profile.photoSide);
      logger.info('添加用户侧面照片');
    }
    if (profile.photoBack) {
      referenceImages.push(profile.photoBack);
      logger.info('添加用户背面照片');
    }

    // 添加服装照片
    if (top) {
      if (top.imageFront) {
        referenceImages.push(top.imageFront);
        logger.info('添加上装正面照片');
      }
      if (top.imageBack) {
        referenceImages.push(top.imageBack);
        logger.info('添加上装背面照片');
      }
    }

    if (bottom) {
      if (bottom.imageFront) {
        referenceImages.push(bottom.imageFront);
        logger.info('添加下装正面照片');
      }
      if (bottom.imageBack) {
        referenceImages.push(bottom.imageBack);
        logger.info('添加下装背面照片');
      }
    }

    if (shoes) {
      if (shoes.imageFront) {
        referenceImages.push(shoes.imageFront);
        logger.info('添加鞋履照片');
      }
    }

    if (referenceImages.length === 0) {
      throw new Error('请至少上传用户照片和服装照片');
    }

    logger.info(`共使用 ${referenceImages.length} 张参考图片`);
    
    // 详细记录所有参考图片URL
    referenceImages.forEach((url, index) => {
      logger.info(`参考图${index + 1}: ${url}`);
    });

    // 构建提示词
    const prompt = this.buildPrompt(profile, top, bottom, shoes, occasion);
    logger.info('提示词:', prompt);

    // 构建请求体
    const requestBody = {
      model: this.model,
      prompt: prompt,
      size: "2K",
      response_format: "url",
      image: referenceImages,
      watermark: false,
      sequential_image_generation: "disabled",
    };
    
    logger.info('请求体:', JSON.stringify(requestBody, null, 2));

    try {
      // 调用豆包API
      const response = await fetch(`${this.apiUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('豆包 API 错误:', { status: response.status, error: errorText });
        throw new Error(`豆包 API 请求失败: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as DoubaoImageResponse;
      
      if (data.data && data.data[0]?.url) {
        logger.info('虚拟试穿图片生成成功');
        return data.data[0].url;
      } else {
        throw new Error('API 返回数据格式错误');
      }
    } catch (error) {
      logger.error('生成试穿图片失败:', error);
      throw error;
    }
  }

  /**
   * 构建生成提示词
   */
  private buildPrompt(
    profile: BodyProfile,
    top?: ClothingItem,
    bottom?: ClothingItem,
    shoes?: ClothingItem,
    occasion: string = '日常'
  ): string {
    let prompt = `虚拟试穿照片生成任务。`;

    // 人物一致性要求（最关键的部分）
    prompt += `【人物一致性要求 - 必须严格遵守】`;
    if (profile.photoFront) {
      prompt += `参考图1是用户正面全身照，`;
      if (profile.photoSide) prompt += `图2是侧面照，`;
      if (profile.photoBack) prompt += `图3是背面照，`;
      prompt += `必须完全保持这个人的面部特征、五官细节、发型发色、身材比例、身高体型、肤色完全一致，不能改变人物 identity。`;
      prompt += `生成的人物必须是同一个人，不能变成其他人。`;
    }

    // 服装要求
    prompt += `【服装要求】`;
    let imageIndex = (profile.photoFront ? 1 : 0) + (profile.photoSide ? 1 : 0) + (profile.photoBack ? 1 : 0);
    
    if (top) {
      imageIndex++;
      prompt += `将图${imageIndex}${top.imageBack ? `和图${imageIndex + 1}` : ''}中的${top.color}${top.name}穿在人物身上，`;
      if (top.imageBack) imageIndex++;
    }

    if (bottom) {
      imageIndex++;
      prompt += `搭配图${imageIndex}${bottom.imageBack ? `和图${imageIndex + 1}` : ''}中的${bottom.color}${bottom.name}，`;
      if (bottom.imageBack) imageIndex++;
    }

    if (shoes) {
      imageIndex++;
      prompt += `搭配图${imageIndex}中的${shoes.color}${shoes.name}，`;
    }

    // 输出要求
    prompt += `【输出要求】`;
    prompt += `场景：${occasion}。`;
    prompt += `全身正面照，自然光照，8K高清，`;
    prompt += `人物必须是参考图中的同一个人，面部特征完全一致，`;
    prompt += `服装细节清晰，布料纹理真实，整体效果真实自然。`;

    return prompt;
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<{success: boolean; message: string}> {
    if (!this.apiKey) {
      return {
        success: false,
        message: '未配置豆包 API Key'
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: 'test',
          size: "1:1",
        }),
      });

      if (response.status === 400) {
        // 400 可能是参数错误，说明API是可用的
        return {
          success: true,
          message: '豆包 API 连接正常'
        };
      }

      if (response.ok) {
        return {
          success: true,
          message: '豆包 API 连接正常'
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          message: `API 错误: ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
}

export const doubaoService = new DoubaoService();
export default doubaoService;
