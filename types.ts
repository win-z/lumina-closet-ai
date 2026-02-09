
export enum ClothingCategory {
  TOP = '上装',
  BOTTOM = '下装',
  DRESS = '连衣裙',
  OUTERWEAR = '外套',
  SHOES = '鞋履',
  ACCESSORY = '配饰'
}

export enum Season {
  SPRING = '春',
  SUMMER = '夏',
  AUTUMN = '秋',
  WINTER = '冬',
  ALL = '四季'
}

export interface ClothingItem {
  id: string;
  imageFront: string; // Base64
  imageBack?: string; // Base64
  category: ClothingCategory;
  name: string;
  color: string;
  
  // New Fields
  brand?: string;
  price?: number;
  purchaseDate?: string;
  tags: string[]; // e.g. ["休闲", "商务", "聚会"]
  
  lastWorn?: string;
}

export interface BodyProfile {
  name: string;
  heightCm: number;
  weightKg: number;
  photoFront?: string; // Base64
  photoSide?: string; // Base64
  photoBack?: string; // Base64
  description?: string; 
}

export interface OutfitSuggestion {
  topId?: string;
  bottomId?: string;
  shoesId?: string;
  reasoning: string;
  occasion: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  weather: string;
  mood: string; // e.g. "开心", "自信"
  notes: string;
  clothingIds: string[]; // IDs of items worn
  photo?: string; // Optional generated image or user upload
}

export interface UserData {
    id: string;
    profile: BodyProfile;
    wardrobe: ClothingItem[];
    diary: DiaryEntry[];
}

// ==================== 穿着记录 ====================
export interface ClothingRecord {
  id: string;
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

export type ViewState = 'wardrobe' | 'profile' | 'stylist' | 'calendar' | 'analytics';
