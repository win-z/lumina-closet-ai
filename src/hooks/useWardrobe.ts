/**
 * ==================== useWardrobe Hook ====================
 * 衣橱数据管理：直接调用 apiClient，通过 setUser 更新本地缓存
 */

import { useCallback } from 'react';
import { useApp } from './useApp';
import { ClothingItem } from '../../types';
import { apiClient } from '../utils/apiClient';

export const useWardrobe = () => {
  const { user, setUser } = useApp();

  const items = user?.wardrobe || [];

  const add = useCallback(async (item: Partial<ClothingItem>) => {
    // 乐观 UI: 临时生成 ID，立即更新界面
    const tempId = `temp_${Date.now()}`;
    const optimisticItem = { ...item, id: tempId, createdAt: new Date().toISOString() } as ClothingItem;

    setUser(prev => {
      if (!prev) return null;
      const newWardrobe = [...prev.wardrobe, optimisticItem];
      // 同步本地缓存
      import('../utils/db').then(({ db, CACHE_KEYS }) => {
        db.set(CACHE_KEYS.WARDROBE, newWardrobe);
      });
      return { ...prev, wardrobe: newWardrobe };
    });

    try {
      const data = await apiClient.post<any>('/api/wardrobe', item);
      if (data.success && data.data) {
        // 成功后，用真实数据替换临时数据
        setUser(prev => {
          if (!prev) return null;
          const newWardrobe = prev.wardrobe.map(w => w.id === tempId ? data.data : w);
          import('../utils/db').then(({ db, CACHE_KEYS }) => db.set(CACHE_KEYS.WARDROBE, newWardrobe));
          return { ...prev, wardrobe: newWardrobe };
        });
      }
    } catch (error) {
      console.error('Wardrobe add error:', error);
      // 失败回滚
      setUser(prev => {
        if (!prev) return null;
        const newWardrobe = prev.wardrobe.filter(w => w.id !== tempId);
        import('../utils/db').then(({ db, CACHE_KEYS }) => db.set(CACHE_KEYS.WARDROBE, newWardrobe));
        return { ...prev, wardrobe: newWardrobe };
      });
      throw error;
    }
  }, [setUser]);

  const update = useCallback(async (id: string, item: Partial<ClothingItem>) => {
    // 乐观 UI
    let previousWardrobe: ClothingItem[] = [];

    setUser(prev => {
      if (!prev) return null;
      previousWardrobe = [...prev.wardrobe];
      const newWardrobe = prev.wardrobe.map(w => w.id === id ? { ...w, ...item } as ClothingItem : w);
      import('../utils/db').then(({ db, CACHE_KEYS }) => db.set(CACHE_KEYS.WARDROBE, newWardrobe));
      return { ...prev, wardrobe: newWardrobe };
    });

    try {
      const data = await apiClient.put<any>(`/api/wardrobe/${id}`, item);
      if (data.success && data.data) {
        setUser(prev => {
          if (!prev) return null;
          const newWardrobe = prev.wardrobe.map(w => w.id === id ? { ...w, ...data.data } : w);
          import('../utils/db').then(({ db, CACHE_KEYS }) => db.set(CACHE_KEYS.WARDROBE, newWardrobe));
          return { ...prev, wardrobe: newWardrobe };
        });
      }
    } catch (error) {
      // 失败回滚
      setUser(prev => {
        if (!prev) return null;
        import('../utils/db').then(({ db, CACHE_KEYS }) => db.set(CACHE_KEYS.WARDROBE, previousWardrobe));
        return { ...prev, wardrobe: previousWardrobe };
      });
      throw error;
    }
  }, [setUser]);

  const remove = useCallback(async (id: string) => {
    // 乐观 UI
    let previousWardrobe: ClothingItem[] = [];

    setUser(prev => {
      if (!prev) return null;
      previousWardrobe = [...prev.wardrobe];
      const newWardrobe = prev.wardrobe.filter(w => w.id !== id);
      import('../utils/db').then(({ db, CACHE_KEYS }) => db.set(CACHE_KEYS.WARDROBE, newWardrobe));
      return { ...prev, wardrobe: newWardrobe };
    });

    try {
      await apiClient.delete<any>(`/api/wardrobe/${id}`);
    } catch (error) {
      // 失败回滚
      setUser(prev => {
        if (!prev) return null;
        import('../utils/db').then(({ db, CACHE_KEYS }) => db.set(CACHE_KEYS.WARDROBE, previousWardrobe));
        return { ...prev, wardrobe: previousWardrobe };
      });
      throw error;
    }
  }, [setUser]);

  const markWorn = useCallback(async (id: string) => {
    setUser(prev => {
      if (!prev) return null;
      const newWardrobe = prev.wardrobe.map(w =>
        w.id === id ? { ...w, lastWorn: new Date().toISOString().split('T')[0] } : w
      );
      import('../utils/db').then(({ db, CACHE_KEYS }) => db.set(CACHE_KEYS.WARDROBE, newWardrobe));
      return { ...prev, wardrobe: newWardrobe };
    });

    try {
      await apiClient.post<any>(`/api/wardrobe/${id}/wear`);
    } catch (error) {
      console.warn('markWorn sync failed, optimistic ui will be overwritten by next fetch', error);
    }
  }, [setUser]);

  const archive = useCallback(async (id: string, archived: boolean) => {
    // 乐观 UI：从衣橱列表中隐藏/恢复归档项
    setUser(prev => {
      if (!prev) return null;
      const newWardrobe = prev.wardrobe.map(w =>
        w.id === id ? { ...w, isArchived: archived } : w
      );
      import('../utils/db').then(({ db, CACHE_KEYS }) => db.set(CACHE_KEYS.WARDROBE, newWardrobe));
      return { ...prev, wardrobe: newWardrobe };
    });

    try {
      await apiClient.patch<any>(`/api/wardrobe/${id}/archive`, { archived });
    } catch (error) {
      // 失败回滚
      setUser(prev => {
        if (!prev) return null;
        const newWardrobe = prev.wardrobe.map(w =>
          w.id === id ? { ...w, isArchived: !archived } : w
        );
        import('../utils/db').then(({ db, CACHE_KEYS }) => db.set(CACHE_KEYS.WARDROBE, newWardrobe));
        return { ...prev, wardrobe: newWardrobe };
      });
      throw error;
    }
  }, [setUser]);

  const getByCategory = useCallback((category: string) => {
    return items.filter(item => item.category === category);
  }, [items]);

  const getById = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  return {
    items,
    add,
    update,
    remove,
    markWorn,
    archive,
    getByCategory,
    getById,
    count: items.length,
  };

};

export default useWardrobe;
