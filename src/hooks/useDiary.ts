/**
 * ==================== useDiary Hook ====================
 * 日记管理
 */

import { useCallback } from 'react';
import { useApp } from './useApp';
import { DiaryEntry } from '../../types';

export const useDiary = () => {
  const { user, addDiaryEntry } = useApp();

  const entries = user?.diary || [];

  const add = useCallback(async (entry: { date: string; weather: string; mood: string; notes: string; clothingIds: string[]; photo?: string | null }) => {
    await addDiaryEntry(entry);
  }, [addDiaryEntry]);

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
