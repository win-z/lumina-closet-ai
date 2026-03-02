/**
 * ==================== useDiary Hook ====================
 * 日记管理：直接调用 apiClient，通过 setUser 更新本地缓存
 */

import { useCallback } from 'react';
import { useApp } from './useApp';
import { DiaryEntry } from '../../types';
import { apiClient } from '../utils/apiClient';

export const useDiary = () => {
  const { user, setUser } = useApp();

  const entries = user?.diary || [];

  const add = useCallback(async (entry: {
    date: string;
    weather: string;
    mood: string;
    notes: string;
    clothingIds: string[];
    photo?: string | null;
  }) => {
    // 乐观 UI
    const tempId = `temp_${Date.now()}`;
    const optimisticEntry = { ...entry, id: tempId, createdAt: new Date().toISOString() } as DiaryEntry;

    setUser(prev => {
      if (!prev) return null;
      // 检查原先是否有当天的记录，如果有则替换，没有则增加
      const existsIdx = prev.diary.findIndex(d => d.date === entry.date);
      let newDiary = [...prev.diary];
      if (existsIdx >= 0) {
        newDiary[existsIdx] = optimisticEntry;
      } else {
        newDiary.push(optimisticEntry);
      }

      import('../utils/db').then(({ db, CACHE_KEYS }) => db.set(CACHE_KEYS.ANALYTICS, newDiary));
      return { ...prev, diary: newDiary };
    });

    try {
      const data = await apiClient.post<any>('/api/diary', entry);
      if (data.success && data.data) {
        setUser(prev => {
          if (!prev) return null;
          const newDiary = prev.diary.map(d => d.id === tempId ? data.data : d);
          import('../utils/db').then(({ db, CACHE_KEYS }) => db.set(CACHE_KEYS.ANALYTICS, newDiary));
          return { ...prev, diary: newDiary };
        });
      }
    } catch (error) {
      console.warn('Diary add optimistic ui failed, reverting...', error);
      setUser(prev => {
        if (!prev) return null;
        const newDiary = prev.diary.filter(d => d.id !== tempId);
        import('../utils/db').then(({ db, CACHE_KEYS }) => db.set(CACHE_KEYS.ANALYTICS, newDiary));
        return { ...prev, diary: newDiary };
      });
      throw error;
    }
  }, [setUser]);

  const getByDate = useCallback((date: string) => {
    return entries.find(entry => entry.date === date);
  }, [entries]);

  const getByDateRange = useCallback((startDate: string, endDate: string) => {
    return entries.filter(entry => entry.date >= startDate && entry.date <= endDate);
  }, [entries]);

  return {
    entries,
    add,
    getByDate,
    getByDateRange,
    count: entries.length,
  };
};

export default useDiary;
