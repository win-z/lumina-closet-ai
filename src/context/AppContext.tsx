/**
 * ==================== App Context ====================
 * 全局状态管理：用户数据、衣橱、日记等
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ClothingItem, BodyProfile, DiaryEntry } from '../../types';

// ==================== Context 状态 ====================
interface AppContextType {
  // 用户信息
  user: {
    id: string;
    profile: BodyProfile;
    wardrobe: ClothingItem[];
    diary: DiaryEntry[];
    savedOutfits: any[];
    isLoggedIn: boolean;
  } | null;

  // 登录状态
  login: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => void;

  // 数据加载
  loading: boolean;

  // 衣橱操作
  addItem: (item: Partial<ClothingItem>) => Promise<void>;
  updateItem: (id: string, item: Partial<ClothingItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  markAsWorn: (id: string) => Promise<void>;

  // 档案操作
  updateProfile: (profile: Partial<BodyProfile>) => Promise<void>;

  // 日记操作
  addDiaryEntry: (entry: { date: string; weather: string; mood: string; notes: string; clothingIds: string[]; photo?: string | null }) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

// ==================== Context Provider ====================
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{
    id: string;
    profile: BodyProfile;
    wardrobe: ClothingItem[];
    diary: DiaryEntry[];
    isLoggedIn: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  const DEFAULT_PROFILE: BodyProfile = {
    name: '默认用户',
    heightCm: 170,
    weightKg: 60,
    description: "等待完善档案...",
  };

  // ==================== 初始化：检查登录状态 ====================
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('lumina_token');
      if (token) {
        try {
          const response = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const data = await response.json();
          
          if (data.success && data.data) {
            setUser({
              id: data.data.account.id,
              profile: data.data.profile || DEFAULT_PROFILE,
              wardrobe: [],
              diary: [],
              savedOutfits: [],
              isLoggedIn: true,
            });
          }
        } catch {
          localStorage.removeItem('lumina_token');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  // ==================== 登录/登出 ====================
  const login = useCallback(async (email: string, password: string, username?: string) => {
    setLoading(true);
    try {
      // 先注册再登录（兼容现有逻辑）
      if (username) {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username }),
        });
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('lumina_token', data.data.token);
        
        const profileResponse = await fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${data.data.token}` },
        });
        const profileData = await profileResponse.json();
        
        if (profileData.success && profileData.data) {
          setUser({
            id: profileData.data.account.id,
            profile: profileData.data.profile || DEFAULT_PROFILE,
            wardrobe: [],
            diary: [],
            savedOutfits: [],
            isLoggedIn: true,
          });
        }
      }
    } catch (error: any) {
      throw new Error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lumina_token');
    setUser(null);
  }, []);

  // ==================== 数据加载 ====================
  const loadUserData = useCallback(async (userId: string) => {
    const token = localStorage.getItem('lumina_token');
    if (!token) return;

    try {
      const [wardrobeRes, diaryRes] = await Promise.all([
        fetch(`/api/wardrobe?page=1&limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`/api/diary?page=1&limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const [wardrobeData, diaryData] = await Promise.all([
        wardrobeRes.json(),
        diaryRes.json(),
      ]);

      if (user) {
        setUser(prev => prev ? {
          ...prev,
          wardrobe: wardrobeData.data || [],
          diary: diaryData.data || [],
          savedOutfits: [],
        } : null);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }, [user]);

  // 初始登录后加载用户数据
  useEffect(() => {
    if (user && user.isLoggedIn && user.wardrobe.length === 0) {
      loadUserData(user.id);
    }
  }, [user, loadUserData]);

  // ==================== 衣橱操作 ====================
  const addItem = useCallback(async (item: Partial<ClothingItem>) => {
    if (!user) return;

    const token = localStorage.getItem('lumina_token');
    const response = await fetch('/api/wardrobe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    });

    const data = await response.json();
    
    if (data.success && data.data) {
      setUser(prev => prev ? { ...prev, wardrobe: [...prev.wardrobe, data.data], savedOutfits: prev.savedOutfits } : null);
    }
  }, [user]);

  const updateItem = useCallback(async (id: string, item: Partial<ClothingItem>) => {
    if (!user) return;

    const token = localStorage.getItem('lumina_token');
    const response = await fetch(`/api/wardrobe/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    });

    const data = await response.json();
    
    if (data.success && data.data) {
      setUser(prev => prev ? {
        ...prev,
        wardrobe: prev.wardrobe.map(w => w.id === id ? { ...w, ...data.data } : w),
        savedOutfits: prev.savedOutfits,
      } : null);
    }
  }, [user]);

  const deleteItem = useCallback(async (id: string) => {
    if (!user) return;

    const token = localStorage.getItem('lumina_token');
    const response = await fetch(`/api/wardrobe/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await response.json();
    
    if (data.success) {
      setUser(prev => prev ? {
        ...prev,
        wardrobe: prev.wardrobe.filter(w => w.id !== id),
        savedOutfits: prev.savedOutfits,
      } : null);
    }
  }, [user]);

  const markAsWorn = useCallback(async (id: string) => {
    if (!user) return;

    const token = localStorage.getItem('lumina_token');
    const response = await fetch(`/api/wardrobe/${id}/wear`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      setUser(prev => prev ? {
        ...prev,
        wardrobe: prev.wardrobe.map(w => w.id === id ? { ...w, lastWorn: new Date().toISOString().split('T')[0] } : w),
        savedOutfits: prev.savedOutfits,
      } : null);
    }
  }, [user]);

  // ==================== 档案操作 ====================
  const updateProfile = useCallback(async (profile: Partial<BodyProfile>) => {
    if (!user) return;

    const token = localStorage.getItem('lumina_token');
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });

    const data = await response.json();

    if (data.success && data.data && data.data.profile) {
      setUser(prev => prev ? { ...prev, profile: { ...prev.profile, ...data.data.profile }, savedOutfits: prev.savedOutfits } : null);
    }
  }, [user]);

  // ==================== 日记操作 ====================
  const addDiaryEntry = useCallback(async (entry: { date: string; weather: string; mood: string; notes: string; clothingIds: string[]; photo?: string | null }) => {
    if (!user) return;

    const token = localStorage.getItem('lumina_token');
    const response = await fetch('/api/diary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(entry),
    });

    const data = await response.json();
    
    if (data.success && data.data) {
      setUser(prev => prev ? { ...prev, diary: [...prev.diary, data.data], savedOutfits: prev.savedOutfits } : null);
    }
  }, [user]);

  const value = {
    user,
    login,
    logout,
    loading,
    addItem,
    updateItem,
    deleteItem,
    markAsWorn,
    updateProfile,
    addDiaryEntry,
    loadUserData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// ==================== Custom Hook ====================
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
