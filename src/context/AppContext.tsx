/**
 * ==================== App Context ====================
 * 全局认证状态：只管 user 身份、login/logout、初始数据加载。
 * 业务操作（衣橱/日记/档案）由各自 hook 直接调用 apiClient + setUser 完成。
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { ClothingItem, BodyProfile, DiaryEntry } from '../../types';
import { apiClient } from '../utils/apiClient';

export type UserState = {
  id: string;
  profile: BodyProfile;
  wardrobe: ClothingItem[];
  diary: DiaryEntry[];
  savedOutfits: any[];
  isLoggedIn: boolean;
} | null;

// ==================== Context 类型 ====================
interface AppContextType {
  user: UserState;
  /** 供各 hook 直接更新 user 状态（不触发 API，只改 UI 缓存） */
  setUser: Dispatch<SetStateAction<UserState>>;
  login: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  loadUserData: (userId: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PROFILE: BodyProfile = {
  name: '默认用户',
  heightCm: 170,
  weightKg: 60,
  description: '等待完善档案...',
};

// ==================== Context Provider ====================
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(null);
  const [loading, setLoading] = useState(false);
  const dataLoadedRef = useRef(false);

  // ==================== 初始化：检查登录状态 ====================
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('lumina_token');
      if (token) {
        try {
          const data = await apiClient.get<any>('/api/users/profile');
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
      if (username) {
        const regData = await apiClient.post<any>('/api/auth/register', { email, password, username });
        if (!regData.success) throw new Error(regData.message || '注册失败');
      }

      const data = await apiClient.post<any>('/api/auth/login', { email, password });
      if (!data.success) throw new Error(data.message || '登录失败');

      localStorage.setItem('lumina_token', data.data.token);

      const profileData = await apiClient.get<any>('/api/users/profile');
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
    } catch (error: any) {
      throw new Error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lumina_token');
    setUser(null);
    dataLoadedRef.current = false;
  }, []);

  // ==================== 数据加载 (通过 cache hook) ====================
  // 定义拉取函数
  const fetchWardrobe = useCallback(() => apiClient.get<any>('/api/wardrobe?page=1&limit=100').then(res => res.data || []), []);
  const fetchDiary = useCallback(() => apiClient.get<any>('/api/diary?page=1&limit=50').then(res => res.data || []), []);
  const fetchOutfits = useCallback(() => apiClient.get<any>('/api/outfits').then(res => res.data || []), []);

  const loadUserData = useCallback(async (_userId: string) => {
    if (!localStorage.getItem('lumina_token')) return;
    try {
      // 在这里我们仍然保留一个手动的全量拉取，用于强制刷新或初次加载
      // 但后续我们可以在各模块里分别使用 useCachedData 让它们自己管自己
      const [wardrobeData, diaryData, outfitsData] = await Promise.all([
        fetchWardrobe(),
        fetchDiary(),
        fetchOutfits(),
      ]);
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          wardrobe: wardrobeData,
          diary: diaryData,
          savedOutfits: outfitsData,
        };
      });

      // 更新缓存
      const { db, CACHE_KEYS } = await import('../utils/db');
      await Promise.all([
        db.set(CACHE_KEYS.WARDROBE, wardrobeData),
        db.set(CACHE_KEYS.ANALYTICS, diaryData), // 借用记录当一部分分析缓存
        db.set(CACHE_KEYS.OUTFITS, outfitsData)
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }, [fetchWardrobe, fetchDiary, fetchOutfits]);

  // 初始登录后静默加载缓存或网络数据
  useEffect(() => {
    if (user && user.isLoggedIn && user.wardrobe.length === 0 && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      // 启动时，先尝试从缓存灌入数据让界面秒出，然后再发起网络请求
      const initFromCache = async () => {
        const { db, CACHE_KEYS } = await import('../utils/db');
        const [cachedWardrobe, cachedDiary, cachedOutfits] = await Promise.all([
          db.get<any[]>(CACHE_KEYS.WARDROBE),
          db.get<any[]>(CACHE_KEYS.ANALYTICS),
          db.get<any[]>(CACHE_KEYS.OUTFITS),
        ]);

        // 如果有任何缓存数据，先 set 给 UI
        if (cachedWardrobe || cachedDiary || cachedOutfits) {
          setUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              wardrobe: cachedWardrobe || [],
              diary: cachedDiary || [],
              savedOutfits: cachedOutfits || [],
            };
          });
        }

        // 然后再静默唤起网络同步更新
        loadUserData(user.id);
      };

      initFromCache();
    }
  }, [user, loadUserData]);

  return (
    <AppContext.Provider value={{ user, setUser, login, logout, loading, loadUserData }}>
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
