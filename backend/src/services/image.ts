/**
 * ==================== 虚拟试穿服务 ====================
 * 使用豆包 Seedream 4.5 多图参考生成功能实现虚拟试穿
 */

import { BodyProfile, ClothingItem } from '../types';
import { logger } from '../utils/logger';
import { doubaoService } from './doubao';

/**
 * 生成穿搭预览图（SVG格式）- 作为后备方案
 */
export function createOutfitPreviewImage(
  profile: BodyProfile,
  top?: ClothingItem,
  bottom?: ClothingItem,
  occasion: string = '日常',
  reasoning?: string
): string {
  logger.info('生成穿搭预览图（SVG）...', { occasion, top: top?.name, bottom: bottom?.name });

  // 获取用户照片URL
  const userPhoto = profile.photoFront || profile.photoSide || profile.photoBack || '';
  const userPhotoDisplay = userPhoto.startsWith('http') 
    ? `<image href="${userPhoto}" x="50" y="100" width="200" height="266" preserveAspectRatio="xMidYMid slice"/>`
    : `<text x="150" y="230" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">暂无照片</text>`;

  // 上装信息
  const topDisplay = top ? `
    <image href="${top.imageFront}" x="280" y="100" width="200" height="266" preserveAspectRatio="xMidYMid slice"/>
    <rect x="280" y="366" width="200" height="40" fill="rgba(255,255,255,0.9)"/>
    <text x="380" y="392" font-family="sans-serif" font-size="14" fill="#1e293b" text-anchor="middle">${top.name}</text>
    <text x="380" y="410" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">${top.color}</text>
  ` : `
    <rect x="280" y="100" width="200" height="266" fill="#f1f5f9" rx="12"/>
    <text x="380" y="230" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">未选择上装</text>
  `;

  // 下装信息
  const bottomDisplay = bottom ? `
    <image href="${bottom.imageFront}" x="50" y="420" width="200" height="266" preserveAspectRatio="xMidYMid slice"/>
    <rect x="50" y="686" width="200" height="40" fill="rgba(255,255,255,0.9)"/>
    <text x="150" y="712" font-family="sans-serif" font-size="14" fill="#1e293b" text-anchor="middle">${bottom.name}</text>
    <text x="150" y="730" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">${bottom.color}</text>
  ` : '';

  // 场合和搭配理由
  const occasionText = occasion || '日常';
  const reasoningText = reasoning || '根据天气和场合推荐';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="530" height="800" viewBox="0 0 530 800">
  <!-- 背景 -->
  <rect width="530" height="800" fill="#fafafa"/>
  
  <!-- 标题 -->
  <text x="265" y="50" font-family="sans-serif" font-size="24" font-weight="bold" fill="#1e293b" text-anchor="middle">AI 穿搭推荐</text>
  <text x="265" y="75" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="middle">${occasionText}</text>

  <!-- 用户照片 -->
  <text x="150" y="90" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">你的照片</text>
  <rect x="50" y="100" width="200" height="266" fill="#f1f5f9" rx="12"/>
  ${userPhotoDisplay}

  <!-- 上装推荐 -->
  <text x="380" y="90" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">上装</text>
  <rect x="280" y="100" width="200" height="266" fill="#f1f5f9" rx="12"/>
  ${topDisplay}

  <!-- 下装推荐 -->
  ${bottomDisplay ? `
    <text x="150" y="400" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">下装</text>
    <rect x="50" y="420" width="200" height="266" fill="#f1f5f9" rx="12"/>
    ${bottomDisplay}
  ` : ''}

  <!-- 搭配理由 -->
  <rect x="280" y="420" width="200" height="266" fill="#f8fafc" rx="12"/>
  <text x="380" y="450" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="middle">搭配理由</text>
  <text x="300" y="480" font-family="sans-serif" font-size="13" fill="#334155" text-anchor="start">
    ${(reasoningText || '').slice(0, 80)}
  </text>
  ${reasoningText.length > 80 ? `
    <text x="300" y="500" font-family="sans-serif" font-size="13" fill="#334155" text-anchor="start">
      ${reasoningText.slice(80, 160)}
    </text>
  ` : ''}

  <!-- 底部说明 -->
  <rect x="50" y="720" width="430" height="60" fill="#f1f5f9" rx="12"/>
  <text x="265" y="755" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="middle">
    💡 建议仅供参考，实际效果因人而异
  </text>
</svg>`;

  const base64 = Buffer.from(svg, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

export class VirtualTryOnService {
  async generate(
    profile: BodyProfile,
    top?: ClothingItem,
    bottom?: ClothingItem,
    shoes?: ClothingItem,
    occasion: string = '日常',
    customPrompt?: string
  ): Promise<string> {
    logger.info('生成虚拟试穿图片...', { 
      occasion, 
      hasTop: !!top, 
      hasBottom: !!bottom,
      hasShoes: !!shoes,
      hasProfile: !!profile.photoFront,
      hasCustomPrompt: !!customPrompt
    });

    // 检查是否有足够的数据
    const hasProfilePhoto = profile.photoFront || profile.photoSide || profile.photoBack;
    const hasClothing = top || bottom || shoes;

    if (!hasProfilePhoto && !hasClothing) {
      throw new Error('请先上传人物照片和选择服装');
    }

    try {
      // 尝试使用豆包API生成真实试穿图，传入自定义提示词
      const resultImage = await doubaoService.generateVirtualTryOn(
        profile, 
        top, 
        bottom, 
        shoes,
        occasion,
        customPrompt
      );
      
      logger.info('虚拟试穿图片生成成功（豆包API）');
      return resultImage;
    } catch (error) {
      logger.error('豆包API生成失败，使用SVG预览:', error);
      
      // 如果豆包API失败，使用SVG作为后备
      const resultImage = createOutfitPreviewImage(profile, top, bottom, occasion, customPrompt);
      logger.info('SVG预览图生成完成');
      return resultImage;
    }
  }
}

export const virtualTryOnService = new VirtualTryOnService();
export default virtualTryOnService;
