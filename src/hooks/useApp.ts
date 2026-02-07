/**
 * ==================== useApp Hook ====================
 * 访问全局 App Context
 */

import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export default useApp;
