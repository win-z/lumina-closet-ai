/**
 * ==================== AI 服务 (统一封装) ====================
 * 使用硅基流动API实现所有AI功能
 *
 * 功能:
 * - 服装图像识别和自动标签 (Qwen2.5-VL)
 * - 穿搭建议生成 (Qwen2.5-72B)
 * - 衣橱健康分析
 */

import { config } from '../config';
import { logger } from '../utils/logger';
import { AutoTagResult, OutfitSuggestion, ClothingItem, BodyProfile, ClothingCategory } from '../types';
import { cleanBase64Prefix } from '../utils/helper';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | object;
}

interface SiliconFlowChatRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

export class AiService {
  private apiKey: string;
  private apiUrl: string;
  private textModel: string;
  private visionModel: string;

  constructor() {
    this.apiKey = config.siliconflow.apiKey;
    this.apiUrl = `${config.siliconflow.apiUrl}/chat/completions`;
    this.textModel = config.siliconflow.model;
    this.visionModel = config.siliconflow.visionModel;
  }

  private async chatRequest(body: SiliconFlowChatRequest): Promise<string> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('硅基流动 API 错误:', { status: response.status, error });
      throw new Error(`硅基流动 API 请求失败: ${response.status}`);
    }

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content || '';
  }

  async autoTagClothing(imageBase64: string): Promise<AutoTagResult> {
    logger.info('开始服装图像识别...');

    const imageUrl = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${cleanBase64Prefix(imageBase64)}`;

    const prompt = `分析这张服装图片，返回JSON格式：
{"name":"简短中文名称","color":"主色调","category":"上装/下装/连衣裙/外套/鞋履/配饰","tags":["风格1","季节1","材质1","场合1"]}
只返回JSON。`;

    try {
      const response = await this.chatRequest({
        model: this.visionModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageUrl } },
              { type: 'text', text: prompt },
            ],
          },
        ],
        max_tokens: 500,
      });

      logger.info('服装识别完成');

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e: any) {
      logger.error('服装识别失败:', e.message);
    }

    return {
      name: '未知单品',
      color: '未知',
      category: ClothingCategory.TOP,
      tags: ['休闲'],
    };
  }

  async suggestOutfit(
    wardrobe: ClothingItem[],
    weather: string,
    occasion: string,
    profile: BodyProfile
  ): Promise<OutfitSuggestion> {
    logger.info('生成穿搭建议...');

    const inventory = wardrobe.map(item => ({
      id: item.id,
      name: item.name,
      color: item.color,
      category: item.category,
      tags: item.tags,
    }));

    const prompt = `作为专业时尚造型师，根据以下信息推荐穿搭：

用户档案: 身高${profile.heightCm}cm, 体重${profile.weightKg}kg
天气: ${weather}
场合: ${occasion}

可用衣橱:
${JSON.stringify(inventory, null, 2)}

请推荐一套搭配（上装+下装+鞋履 或 连衣裙+鞋履），返回JSON格式：
{
  "topId": "上装ID",
  "bottomId": "下装ID", 
  "shoesId": "鞋履ID",
  "reasoning": "搭配理由（中文，100字以内）",
  "occasion": "场合"
}
只返回JSON。`;

    const response = await this.chatRequest({
      model: this.textModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    logger.info('穿搭建议生成完成');

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      logger.warn('解析穿搭建议结果失败');
    }

    return {
      reasoning: '无法生成建议',
      occasion,
    };
  }

  async analyzeWardrobeHealth(wardrobe: ClothingItem[]): Promise<string> {
    logger.info('分析衣橱健康度...');

    const summary = wardrobe.map(w => `${w.color}${w.category} (${w.tags.join(',')})`).join('；');

    const prompt = `分析以下衣橱，给出3点改进建议：

${summary}

请用中文回复，使用Markdown格式，从以下角度分析：
1. 颜色搭配建议
2. 品类完整性建议
3. 风格多样性建议

回复格式：
## 衣橱健康分析

### 💡 建议1
...

### 💡 建议2
...

### 💡 建议3
...`;

    const response = await this.chatRequest({
      model: this.textModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
    });

    logger.info('衣橱分析完成');
    return response || '分析失败';
  }
}

export const aiService = new AiService();
export default aiService;
