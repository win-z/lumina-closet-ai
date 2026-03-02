/**
 * ==================== useProfile Hook ====================
 * 用户档案管理：直接调用 apiClient，通过 setUser 更新本地缓存
 */

import { useCallback } from 'react';
import { useApp } from './useApp';
import { BodyProfile } from '../../types';
import { apiClient } from '../utils/apiClient';

export const useProfile = () => {
  const { user, setUser } = useApp();

  const profile = user?.profile;
  const isLoggedIn = user?.isLoggedIn || false;

  const update = useCallback(async (data: Partial<BodyProfile>) => {
    const res = await apiClient.put<any>('/api/users/profile', data);
    if (res.success && res.data?.profile) {
      setUser(prev => prev ? { ...prev, profile: { ...prev.profile, ...res.data.profile } } : null);
    }
  }, [setUser]);

  return {
    profile,
    isLoggedIn,
    update,
  };
};

export default useProfile;
