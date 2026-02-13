/**
 * ==================== PWA Update Manager Hook ====================
 * 
 * 功能：
 * 1. 检测PWA更新可用
 * 2. 提示用户更新
 * 3. 自动刷新获取最新版本
 * 
 * 使用方式：
 * const { needRefresh, updateServiceWorker, offlineReady } = usePWA();
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// 定义Service Worker相关类型
type ServiceWorkerRegistration = {
  update: () => Promise<void>;
  installing?: ServiceWorker | null;
  waiting?: ServiceWorker | null;
  active?: ServiceWorker | null;
};

interface PWAState {
  /** 是否有新版本可用 */
  needRefresh: boolean;
  /** 离线是否就绪 */
  offlineReady: boolean;
  /** 是否正在更新 */
  isUpdating: boolean;
  /** 更新进度 */
  updateProgress: number;
  /** 是否有错误 */
  error: string | null;
  /** 当前版本号 */
  currentVersion: string;
  /** 新版本号 */
  newVersion: string | null;
}

interface PWAActions {
  /** 触发更新 */
  updateServiceWorker: () => Promise<void>;
  /** 忽略本次更新 */
  dismissUpdate: () => void;
  /** 手动检查更新 */
  checkForUpdates: () => Promise<void>;
  /** 清除错误 */
  clearError: () => void;
}

export type UsePWAReturn = PWAState & PWAActions;

// 版本存储key
const VERSION_KEY = 'closet-pwa-version';
const UPDATE_DISMISSED_KEY = 'closet-update-dismissed';
const UPDATE_DISMISSED_DURATION = 24 * 60 * 60 * 1000; // 24小时

/**
 * PWA更新管理Hook
 * 
 * @param options 配置选项
 * @returns PWA状态和操作
 */
export function usePWA(options?: {
  /** 自动检查间隔（毫秒），默认5分钟 */
  checkInterval?: number;
  /** 发现更新时是否自动提示 */
  autoPrompt?: boolean;
  /** 发现更新时是否自动更新 */
  autoUpdate?: boolean;
}): UsePWAReturn {
  const { 
    checkInterval = 5 * 60 * 1000, // 默认5分钟
    autoPrompt = true,
    autoUpdate = false 
  } = options || {};

  const [state, setState] = useState<PWAState>({
    needRefresh: false,
    offlineReady: false,
    isUpdating: false,
    updateProgress: 0,
    error: null,
    currentVersion: localStorage.getItem(VERSION_KEY) || '1.0.0',
    newVersion: null,
  });

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  /**
   * 获取Service Worker注册
   */
  const getRegistration = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      return null;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      return reg as ServiceWorkerRegistration;
    } catch (error) {
      console.error('[PWA] Failed to get service worker registration:', error);
      return null;
    }
  }, []);

  /**
   * 手动检查更新
   */
  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      setState(prev => ({ ...prev, error: '浏览器不支持Service Worker' }));
      return;
    }

    try {
      const reg = await getRegistration();
      if (reg) {
        await reg.update();
        console.log('[PWA] Update check completed');
      }
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '检查更新失败' 
      }));
    }
  }, [getRegistration]);

  /**
   * 触发Service Worker更新
   */
  const updateServiceWorker = useCallback(async () => {
    if (updateSWRef.current) {
      setState(prev => ({ ...prev, isUpdating: true, updateProgress: 0 }));
      
      try {
        // 触发更新
        await updateSWRef.current(true);
        
        // 更新版本号
        const newVersion = new Date().toISOString();
        localStorage.setItem(VERSION_KEY, newVersion);
        
        setState(prev => ({
          ...prev,
          isUpdating: false,
          updateProgress: 100,
          currentVersion: newVersion,
          needRefresh: false,
          newVersion: null,
        }));
        
        console.log('[PWA] Update completed successfully');
      } catch (error) {
        setState(prev => ({
          ...prev,
          isUpdating: false,
          error: error instanceof Error ? error.message : '更新失败',
        }));
      }
    } else if (registrationRef.current?.waiting) {
      // 发送SKIP_WAITING消息给waiting状态的Service Worker
      registrationRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // 等待更新完成并刷新页面
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    } else {
      // 如果没有可用的更新函数，直接刷新页面
      window.location.reload();
    }
  }, []);

  /**
   * 忽略本次更新
   */
  const dismissUpdate = useCallback(() => {
    localStorage.setItem(UPDATE_DISMISSED_KEY, Date.now().toString());
    setState(prev => ({
      ...prev,
      needRefresh: false,
      newVersion: null,
    }));
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * 检查更新是否被忽略
   */
  const isUpdateDismissed = useCallback((): boolean => {
    const dismissedAt = localStorage.getItem(UPDATE_DISMISSED_KEY);
    if (!dismissedAt) return false;
    
    const dismissedTime = parseInt(dismissedAt, 10);
    const now = Date.now();
    return (now - dismissedTime) < UPDATE_DISMISSED_DURATION;
  }, []);

  // 初始化Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker not supported');
      return;
    }

    let updateInterval: NodeJS.Timeout | null = null;

    const initSW = async () => {
      try {
        const reg = await getRegistration();
        if (reg) {
          registrationRef.current = reg;
          
          // 监听Service Worker状态变化
          const handleStateChange = () => {
            if (reg.installing) {
              console.log('[PWA] Service Worker installing...');
            }
            
            if (reg.waiting) {
              console.log('[PWA] Service Worker waiting...');
              
              // 检查是否被忽略
              if (!isUpdateDismissed() || autoUpdate) {
                setState(prev => ({
                  ...prev,
                  needRefresh: true,
                  newVersion: new Date().toISOString(),
                }));
                
                if (autoUpdate) {
                  updateServiceWorker();
                }
              }
            }
            
            if (reg.active) {
              console.log('[PWA] Service Worker active');
              setState(prev => ({ ...prev, offlineReady: true }));
            }
          };

          reg.addEventListener('updatefound', () => {
            console.log('[PWA] Update found');
            handleStateChange();
            
            // 监听installing状态变化
            if (reg.installing) {
              reg.installing.addEventListener('statechange', handleStateChange);
            }
          });

          // 初始状态检查
          handleStateChange();

          // 定期检查更新
          updateInterval = setInterval(() => {
            console.log('[PWA] Checking for updates...');
            reg.update();
          }, checkInterval);
        }
      } catch (error) {
        console.error('[PWA] Failed to initialize:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '初始化失败',
        }));
      }
    };

    // 使用虚拟模块方式获取vite-plugin-pwa提供的注册函数
    // 这个会在构建时被正确处理
    if (import.meta.hot) {
      // 开发模式下不需要Service Worker更新检测
      console.log('[PWA] Development mode - update checking disabled');
    } else {
      initSW();
    }

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [checkInterval, autoUpdate, getRegistration, updateServiceWorker, isUpdateDismissed]);

  // 监听来自vite-plugin-pwa的更新事件
  useEffect(() => {
    const handleOfflineReady = () => {
      setState(prev => ({ ...prev, offlineReady: true }));
    };

    const handleNeedRefresh = () => {
      if (!isUpdateDismissed()) {
        setState(prev => ({
          ...prev,
          needRefresh: true,
          newVersion: new Date().toISOString(),
        }));
      }
    };

    // 监听自定义事件
    window.addEventListener('pwa:offline-ready', handleOfflineReady as EventListener);
    window.addEventListener('pwa:need-refresh', handleNeedRefresh as EventListener);

    return () => {
      window.removeEventListener('pwa:offline-ready', handleOfflineReady as EventListener);
      window.removeEventListener('pwa:need-refresh', handleNeedRefresh as EventListener);
    };
  }, [isUpdateDismissed]);

  return {
    ...state,
    updateServiceWorker,
    dismissUpdate,
    checkForUpdates,
    clearError,
  };
}

/**
 * 注册Service Worker（由vite-plugin-pwa自动处理）
 * 这个hook用于在应用启动时确保Service Worker已注册
 */
export function useRegisterSW() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setError('浏览器不支持Service Worker');
      return;
    }

    // vite-plugin-pwa会在构建时自动注册
    // 这里我们只需要监听注册状态
    navigator.serviceWorker.ready
      .then(() => {
        console.log('[PWA] Service Worker registered and ready');
        setIsRegistered(true);
      })
      .catch((err) => {
        console.error('[PWA] Service Worker registration failed:', err);
        setError(err.message);
      });
  }, []);

  return { isRegistered, error };
}

export default usePWA;
