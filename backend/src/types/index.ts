/**
 * ==================== 后端类型定义 ====================
 * 与前端 types.ts 保持一致，并添加后端特有类型
 */

// ==================== 服装类别枚举 ====================
export enum ClothingCategory {
  TOP = '上装',
  BOTTOM = '下装',
  DRESS = '连衣裙',
  OUTERWEAR = '外套',
  SHOES = '鞋履',
  ACCESSORY = '配饰'
}

// ==================== 季节枚举 ====================
export enum Season {
  SPRING = '春',
  SUMMER = '夏',
  AUTUMN = '秋',
  WINTER = '冬',
  ALL = '四季'
}

// ==================== 服装单项 ====================
export interface ClothingItem {
  id: string;
  imageFront?: string;        // 图片URL或Base64
  imageBack?: string;        // 可选的背面图片
  category: ClothingCategory;
  name: string;
  color: string;
  brand?: string;
  price?: number;
  purchaseDate?: string;
  tags: string[];            // 风格标签数组
  lastWorn?: string;
  createdAt: string;         // 创建时间
  updatedAt: string;         // 更新时间
}

// ==================== 身体档案 ====================
export interface BodyProfile {
  id: string;
  userId: string;
  name: string;
  heightCm: number;
  weightKg: number;
  photoFront?: string;
  photoSide?: string;
  photoBack?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 穿搭建议 ====================
export interface OutfitSuggestion {
  topId?: string;
  bottomId?: string;
  shoesId?: string;
  reasoning: string;
  occasion: string;
}

// ==================== 日记条目 ====================
export interface DiaryEntry {
  id: string;
  userId: string;
  date: string;
  weather: string;
  mood: string;
  notes: string;
  clothingIds: string[];
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 已保存搭配 ====================
export interface SavedOutfit {
  id: string;
  userId: string;
  name?: string;
  tags: string[];
  weather?: string;
  occasion?: string;
  topId?: string;
  bottomId?: string;
  shoesId?: string;
  reasoning?: string;
  tryonImage?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 用户数据（完整） ====================
export interface UserData {
  id: string;
  profile: BodyProfile;
  wardrobe: ClothingItem[];
  diary: DiaryEntry[];
  savedOutfits: SavedOutfit[];
}

// ==================== 用户账户（认证用） ====================
export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  username: string;
  createdAt: string;
  lastLoginAt?: string;
}

// ==================== JWT负载 ====================
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// ==================== API响应类型 ====================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== 请求体类型 ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

// ==================== 穿着记录 ====================
export interface ClothingRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  clothingIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 穿着统计 ====================
export interface ClothingWearStats {
  clothingId: string;
  wearCount: number;
  lastWorn?: string;
}

// ==================== 分析结果 ====================
export interface AnalysisResult {
  id: string;
  userId: string;
  categoryStats: Record<string, number>;
  colorStats: Record<string, number>;
  brandStats: Record<string, number>;
  priceStats: {
    totalValue: number;
    averagePrice: number;
    maxPrice: number;
    minPrice: number;
  };
  wearStats: ClothingWearStats[];
  aiAnalysis?: string;
  createdAt: string;
}

// ==================== 视图状态 ====================
export type ViewState = 'wardrobe' | 'profile' | 'stylist' | 'calendar' | 'analytics';

// ==================== AI服务类型 ====================
export interface AutoTagResult {
  name: string;
  color: string;
  category: ClothingCategory;
  tags: string[];
}

export interface OutfitGenerationParams {
  wardrobe: ClothingItem[];
  weather: string;
  occasion: string;
  profile: BodyProfile;
}

export interface VirtualTryOnParams {
  profile: BodyProfile;
  top?: ClothingItem;
  bottom?: ClothingItem;
  occasion: string;
}
