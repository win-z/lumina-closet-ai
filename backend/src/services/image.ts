/**
 * ==================== 虚拟试穿服务 ====================
 * 虚拟试穿功能说明：
 * 由于当前使用的硅基流动API主要提供文本和图像理解能力，
 * 真正的虚拟试穿需要专业的图像生成模型（如Stable Diffusion + LoRA）。
 *
 * 当前实现：生成一张带有穿搭方案说明的展示图片
 */

import { BodyProfile, ClothingItem } from '../types';
import { logger } from '../utils/logger';

function createPlaceholderImage(top?: ClothingItem, bottom?: ClothingItem, occasion: string = '日常'): string {
  const clothingItems: { name: string; color: string; category: string }[] = [];
  if (top) clothingItems.push({ name: top.name, color: top.color, category: '上装' });
  if (bottom) clothingItems.push({ name: bottom.name, color: bottom.color, category: '下装' });

  let itemsSvg = '';
  let yOffset = 180;
  clothingItems.forEach((item) => {
    itemsSvg += `
      <rect x="100" y="${yOffset}" width="400" height="80" rx="12" fill="#e2e8f0"/>
      <text x="130" y="${yOffset + 35}" font-family="sans-serif" font-size="20" font-weight="bold" fill="#0f172a">${item.category}: ${item.name}</text>
      <text x="130" y="${yOffset + 60}" font-family="sans-serif" font-size="16" fill="#64748b">颜色: ${item.color}</text>
    `;
    yOffset += 110;
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <rect width="600" height="800" fill="#f8fafc"/>

  <text x="300" y="60" font-family="sans-serif" font-size="32" font-weight="bold" fill="#1e293b" text-anchor="middle">AI 虚拟试穿</text>
  <text x="300" y="100" font-family="sans-serif" font-size="18" fill="#64748b" text-anchor="middle">穿搭方案预览</text>

  ${itemsSvg}

  <text x="300" y="${yOffset + 40}" font-family="sans-serif" font-size="22" font-weight="bold" fill="#6366f1" text-anchor="middle">场合: ${occasion}</text>

  <text x="300" y="760" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">* 实际效果需专业图像生成API支持</text>
</svg>`;

  const base64 = Buffer.from(svg, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

export class VirtualTryOnService {
  async generate(profile: BodyProfile, top?: ClothingItem, bottom?: ClothingItem, occasion: string = '日常'): Promise<string> {
    logger.info('生成虚拟试穿预览...');

    const hasPhotos = profile.photoFront || profile.photoSide || profile.photoBack;
    const hasClothing = top || bottom;

    if (!hasPhotos && !hasClothing) {
      throw new Error('请先上传人物照片和选择服装');
    }

    const resultImage = createPlaceholderImage(top, bottom, occasion);

    logger.info('虚拟试穿预览生成完成');
    return resultImage;
  }
}

export const virtualTryOnService = new VirtualTryOnService();
export default virtualTryOnService;
