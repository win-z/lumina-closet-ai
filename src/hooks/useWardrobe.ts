/**
 * ==================== useWardrobe Hook ====================
 * 衣橱数据管理
 */

import { useCallback } from 'react';
import { useApp } from './useApp';
import { ClothingItem } from '../../types';

export const useWardrobe = () => {
  const { user, addItem, updateItem, deleteItem, markAsWorn } = useApp();

  const items = user?.wardrobe || [];

  const add = useCallback(async (item: Partial<ClothingItem>) => {
    await addItem(item);
  }, [addItem]);

  const update = useCallback(async (id: string, item: Partial<ClothingItem>) => {
    await updateItem(id, item);
  }, [updateItem]);

  const remove = useCallback(async (id: string) => {
    await deleteItem(id);
  }, [deleteItem]);

  const markWorn = useCallback(async (id: string) => {
    await markAsWorn(id);
  }, [markAsWorn]);

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
    getByCategory,
    getById,
    count: items.length,
  };
};

export default useWardrobe;
