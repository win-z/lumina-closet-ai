/**
 * ==================== PWA Update Toast Component ====================
 * 
 * 功能：
 * 1. 显示PWA更新可用提示
 * 2. 显示更新进度
 * 3. 提供更新和忽略按钮
 */

import React from 'react';
import { RefreshCw, X, Download, CheckCircle2 } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

interface PWAUpdateToastProps {
  /** 自定义位置 */
  position?: 'top' | 'bottom';
  /** 自定义样式 */
  className?: string;
}

/**
 * PWA更新提示组件
 * 
 * 使用示例：
 * ```tsx
 * function App() {
 *   return (
 *     <div>
 *       <YourApp />
 *       <PWAUpdateToast position="bottom" />
 *     </div>
 *   );
 * }
 * ```
 */
export const PWAUpdateToast: React.FC<PWAUpdateToastProps> = ({
  position = 'bottom',
  className = '',
}) => {
  const {
    needRefresh,
    offlineReady,
    isUpdating,
    updateProgress,
    error,
    currentVersion,
    newVersion,
    updateServiceWorker,
    dismissUpdate,
    clearError,
  } = usePWA({
    checkInterval: 5 * 60 * 1000, // 每5分钟检查一次
    autoPrompt: true,
    autoUpdate: false,
  });

  // 如果不需要更新且没有错误，不显示
  if (!needRefresh && !error && !offlineReady) {
    return null;
  }

  // 位置样式
  const positionClasses = position === 'top'
    ? 'top-4 left-4 right-4'
    : 'bottom-20 left-4 right-4';

  // 离线就绪提示（首次安装完成）
  if (offlineReady && !needRefresh && !error) {
    return (
      <div
        className={`
          fixed ${positionClasses} z-[100]
          bg-gradient-to-r from-emerald-500 to-teal-500
          text-white rounded-2xl shadow-xl shadow-emerald-200/50
          p-4 mx-auto max-w-md
          animate-fade-in
          ${className}
        `}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 size={24} className="flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">应用已就绪</p>
            <p className="text-xs text-white/80 mt-0.5">
              离线模式已启用，您可以在没有网络时使用
            </p>
          </div>
          <button
            onClick={clearError}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  // 错误提示
  if (error) {
    return (
      <div
        className={`
          fixed ${positionClasses} z-[100]
          bg-gradient-to-r from-red-500 to-rose-500
          text-white rounded-2xl shadow-xl shadow-red-200/50
          p-4 mx-auto max-w-md
          animate-fade-in
          ${className}
        `}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="font-medium text-sm">更新出错</p>
            <p className="text-xs text-white/80 mt-0.5">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
          >
            知道了
          </button>
        </div>
      </div>
    );
  }

  // 更新可用提示
  return (
    <div
      className={`
        fixed ${positionClasses} z-[100]
        bg-gradient-to-r from-indigo-500 to-violet-500
        text-white rounded-2xl shadow-xl shadow-indigo-200/50
        p-4 mx-auto max-w-md
        animate-slide-up
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {/* 图标 */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl
          bg-white/20 flex items-center justify-center
          ${isUpdating ? 'animate-pulse' : ''}
        `}>
          {isUpdating ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <Download size={20} />
          )}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {isUpdating ? '正在更新应用...' : '发现新版本'}
          </p>
          <p className="text-xs text-white/80 mt-0.5 truncate">
            {isUpdating
              ? `进度: ${updateProgress}%`
              : '更新包含新功能和改进，建议立即更新'}
          </p>
          
          {/* 进度条 */}
          {isUpdating && (
            <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${updateProgress}%` }}
              />
            </div>
          )}
          
          {/* 版本信息 */}
          {!isUpdating && (
            <p className="text-[10px] text-white/60 mt-1">
              当前版本: {currentVersion.slice(0, 8)}...
              {newVersion && ` → 新版本: ${newVersion.slice(0, 8)}...`}
            </p>
          )}
        </div>

        {/* 按钮 */}
        <div className="flex items-center gap-1">
          {!isUpdating && (
            <>
              <button
                onClick={dismissUpdate}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="稍后更新"
                title="稍后更新"
              >
                <X size={18} />
              </button>
              <button
                onClick={updateServiceWorker}
                className="px-3 py-2 bg-white text-indigo-600 rounded-lg text-xs font-semibold hover:bg-white/90 transition-colors shadow-lg"
                aria-label="立即更新"
              >
                更新
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 简化的PWA更新按钮（用于设置页面）
 */
export const PWAUpdateButton: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const {
    needRefresh,
    offlineReady,
    isUpdating,
    checkForUpdates,
    updateServiceWorker,
  } = usePWA({
    checkInterval: 60 * 1000, // 1分钟
    autoPrompt: false,
  });

  const handleClick = () => {
    if (needRefresh) {
      updateServiceWorker();
    } else {
      checkForUpdates();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isUpdating}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl
        font-medium text-sm transition-all
        ${needRefresh
          ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-200'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isUpdating ? (
        <RefreshCw size={16} className="animate-spin" />
      ) : needRefresh ? (
        <Download size={16} />
      ) : offlineReady ? (
        <CheckCircle2 size={16} />
      ) : (
        <RefreshCw size={16} />
      )}
      <span>
        {isUpdating
          ? '更新中...'
          : needRefresh
          ? '有新版本'
          : offlineReady
          ? '已是最新'
          : '检查更新'}
      </span>
    </button>
  );
};

export default PWAUpdateToast;
