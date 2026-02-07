/**
 * ==================== useProfile Hook ====================
 * 用户档案管理
 */

import { useCallback } from 'react';
import { useApp } from './useApp';
import { BodyProfile } from '../../types';

export const useProfile = () => {
  const { user, updateProfile } = useApp();

  const profile = user?.profile;
  const isLoggedIn = user?.isLoggedIn || false;

  const update = useCallback(async (data: Partial<BodyProfile>) => {
    await updateProfile(data);
  }, [updateProfile]);

  return {
    profile,
    isLoggedIn,
    update,
  };
};

export default useProfile;
