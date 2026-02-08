/**
 * ==================== 前端API服务 ====================
 * 统一处理所有后端API请求
 */

import { ClothingItem, BodyProfile } from "../types";

// 使用相对路径，通过Vite代理转发到后端
const API_BASE = '';

interface ApiResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: { code: string; details?: unknown };
}

// 获取认证token
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('lumina_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// 统一请求方法
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  console.log(`[API] ${options.method || 'GET'} ${url}`);

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  if (!text) {
    throw new Error('服务器返回空响应');
  }

  try {
    const result = JSON.parse(text) as ApiResult<T>;
    return result.data as T;
  } catch {
    throw new Error(`解析响应失败: ${text.substring(0, 100)}`);
  }
}

// ==================== 认证API ====================

export const authApi = {
  login: async (email: string, password: string) => {
    const result = await request<{ user: { id: string; email: string; username: string }; token: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    localStorage.setItem('lumina_token', result.token);
    return result;
  },

  register: async (email: string, password: string, username: string) => {
    const result = await request<{ user: { id: string; email: string; username: string }; token: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, username }),
      }
    );
    localStorage.setItem('lumina_token', result.token);
    return result;
  },
};

// ==================== 衣橱API ====================

export const wardrobeApi = {
  getAll: async (page = 1, limit = 20) => {
    return request<ClothingItem[]>(`/api/wardrobe?page=${page}&limit=${limit}`);
  },
  add: async (item: Partial<ClothingItem>) => {
    return request<ClothingItem>('/api/wardrobe', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
  update: async (id: string, data: Partial<ClothingItem>) => {
    return request<ClothingItem>(`/api/wardrobe/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    return request(`/api/wardrobe/${id}`, { method: 'DELETE' });
  },
};

// ==================== 用户API ====================

export const userApi = {
  getProfile: async () => {
    return request<{ account: { id: string; email: string; username: string }; profile: BodyProfile | null }>(
      '/api/users/profile'
    );
  },
  updateProfile: async (data: Partial<BodyProfile>) => {
    return request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  getStats: async () => {
    return request<{ totalClothing: number; totalDiary: number; mostWornColors: string[] }>(
      '/api/users/stats'
    );
  },
};

// ==================== 日记API ====================

export const diaryApi = {
  getAll: async (page = 1, limit = 20) => {
    return request<{
      id: string;
      date: string;
      weather: string;
      mood: string;
      notes: string;
      photo: string | null;
      clothingIds: string[];
    }[]>(
      `/api/diary?page=${page}&limit=${limit}`
    );
  },
  add: async (entry: {
    date: string;
    weather: string;
    mood: string;
    notes: string;
    clothingIds: string[];
    photo?: string | null;
  }) => {
    return request('/api/diary', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },
  delete: async (id: string) => {
    return request(`/api/diary/${id}`, { method: 'DELETE' });
  },
};

// ==================== AI API ====================

export const aiApi = {
  autoTag: async (imageBase64: string) => {
    return request<{ name: string; color: string; category: string; tags: string[] }>('/api/ai/auto-tag', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64 }),
    });
  },

  outfit: async (weather: string, occasion: string, topId?: string, bottomId?: string, shoesId?: string) => {
    return request<{
      topId?: string;
      bottomId?: string;
      shoesId?: string;
      reasoning: string;
      tryOnImage?: string;
    }>(
      '/api/ai/outfit',
      {
        method: 'POST',
        body: JSON.stringify({ weather, occasion, topId, bottomId, shoesId }),
      }
    );
  },

  analyze: async () => {
    return request<{ analysis: string }>('/api/ai/analyze', { method: 'POST' });
  },
};

// ==================== 已保存搭配 API ====================

export const outfitsApi = {
  getAll: async () => {
    return request<{
      id: string;
      name?: string;
      tags: string[];
      weather?: string;
      occasion?: string;
      topId?: string;
      bottomId?: string;
      shoesId?: string;
      reasoning?: string;
      tryonImage?: string;
      clothingItems: any[];
    }[]>('/api/outfits');
  },
  save: async (outfit: {
    name?: string;
    tags: string[];
    weather?: string;
    occasion?: string;
    topId?: string;
    bottomId?: string;
    shoesId?: string;
    reasoning?: string;
    tryonImage?: string;
  }) => {
    return request('/api/outfits', {
      method: 'POST',
      body: JSON.stringify(outfit),
    });
  },
  delete: async (id: string) => {
    return request(`/api/outfits/${id}`, { method: 'DELETE' });
  },
};

// ==================== 兼容旧代码导出 ====================

// 保持向后兼容
export const autoTagClothing = aiApi.autoTag;
export const suggestOutfit = aiApi.outfit;
export const analyzeWardrobeHealth = aiApi.analyze;

// ==================== 统一API服务类 ====================

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('lumina_token', token);
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('lumina_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('lumina_token');
  }

  // 便利方法
  async getProfile() {
    return userApi.getProfile();
  }

  async getWardrobe(options?: { category?: string; page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    return wardrobeApi.getAll(options?.page, options?.limit);
  }

  async addClothing(item: Partial<ClothingItem>) {
    return wardrobeApi.add(item);
  }

  async getDiary(options?: { page?: number; limit?: number }) {
    return diaryApi.getAll(options?.page, options?.limit);
  }

  async addDiary(entry: {
    date: string;
    weather: string;
    mood: string;
    notes: string;
    clothingIds: string[];
    photo?: string | null;
  }) {
    return diaryApi.add(entry);
  }

  async updateProfile(data: Partial<BodyProfile>) {
    return userApi.updateProfile(data);
  }
}

export const apiService = new ApiService();
