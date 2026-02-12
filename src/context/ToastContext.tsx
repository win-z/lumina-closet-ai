import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showConfirm: (options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Toast 图标组件
const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const iconClass = "w-5 h-5";
  switch (type) {
    case 'success':
      return <CheckCircle className={`${iconClass} text-emerald-500`} />;
    case 'error':
      return <XCircle className={`${iconClass} text-rose-500`} />;
    case 'warning':
      return <AlertCircle className={`${iconClass} text-amber-500`} />;
    case 'info':
    default:
      return <Info className={`${iconClass} text-blue-500`} />;
  }
};

// Confirm Dialog 组件
const ConfirmDialog: React.FC<{
  dialog: ConfirmDialogState;
  onClose: () => void;
}> = ({ dialog, onClose }) => {
  if (!dialog.isOpen) return null;

  const handleConfirm = () => {
    dialog.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    dialog.onCancel();
    onClose();
  };

  const styles = {
    danger: {
      icon: <AlertTriangle className="w-12 h-12 text-rose-500" />,
      confirmBtn: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200',
      bg: 'bg-rose-50/50',
    },
    warning: {
      icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
      confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
      bg: 'bg-amber-50/50',
    },
    info: {
      icon: <Info className="w-12 h-12 text-blue-500" />,
      confirmBtn: 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200',
      bg: 'bg-blue-50/50',
    },
  };

  const style = styles[dialog.type];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleCancel}
      />
      <div className={`
        relative w-full max-w-[320px] 
        bg-white rounded-3xl shadow-2xl
        transform transition-all duration-300 ease-out
        scale-100 opacity-100
        overflow-hidden
      `}>
        <div className={`h-1.5 w-full ${dialog.type === 'danger' ? 'bg-rose-500' : dialog.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
        <div className="p-6 flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${style.bg}`}>
            {style.icon}
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{dialog.title}</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">{dialog.message}</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
            >
              {dialog.cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 px-4 rounded-xl font-medium shadow-lg transition-all ${style.confirmBtn}`}
            >
              {dialog.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 单个 Toast 项组件
const ToastItem: React.FC<{
  toast: Toast;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const progressRef = useRef<number>(100);
  const rafRef = useRef<number | null>(null);

  const duration = toast.duration || 3000;

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const animate = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / duration) * 100;
      
      progressRef.current = newProgress;
      setProgress(newProgress);

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        handleClose();
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  // 背景色样式
  const bgStyles = {
    success: 'bg-emerald-50 border-emerald-200 shadow-emerald-100',
    error: 'bg-rose-50 border-rose-200 shadow-rose-100',
    warning: 'bg-amber-50 border-amber-200 shadow-amber-100',
    info: 'bg-blue-50 border-blue-200 shadow-blue-100',
  };

  // 进度条颜色
  const progressColors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  return (
    <div
      className={`
        relative flex items-center gap-3 px-4 py-3 rounded-2xl border
        backdrop-blur-lg shadow-lg
        transform transition-all duration-300 ease-out
        ${bgStyles[toast.type]}
        ${isExiting ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'}
        min-w-[280px] max-w-[340px]
      `}
    >
      {/* 图标 */}
      <ToastIcon type={toast.type} />
      
      {/* 消息内容 */}
      <p className="flex-1 text-sm font-medium text-slate-700 leading-relaxed">
        {toast.message}
      </p>
      
      {/* 关闭按钮 */}
      <button
        onClick={handleClose}
        className="p-1 rounded-full hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>

      {/* 底部进度条 */}
      <div 
        className={`
          absolute bottom-0 left-0 h-0.5 rounded-full
          ${progressColors[toast.type]}
          transition-all ease-linear
        `}
        style={{ 
          width: `${progress}%`,
          opacity: 0.6 
        }}
      />
    </div>
  );
};

// Toast Provider 组件
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '确定',
    cancelText: '取消',
    type: 'warning',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const showConfirm = useCallback(({
    title = '确认操作',
    message,
    confirmText = '确定',
    cancelText = '取消',
    type = 'warning',
  }: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ConfirmDialog dialog={confirmDialog} onClose={closeConfirmDialog} />
      {/* Toast 容器 - 固定在屏幕上方，考虑移动端安全区域 */}
      <div 
        className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        <div className="w-full max-w-[393px] mx-auto px-4 flex flex-col items-center gap-2">
          {toasts.map((toast, index) => (
            <div 
              key={toast.id}
              className="pointer-events-auto"
              style={{
                animation: `toastSlideIn 0.3s ease-out ${index * 0.05}s both`,
              }}
            >
              <ToastItem toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </div>
      </div>
      
      {/* CSS 动画 */}
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
