/**
 * ==================== ImageRenderer Component (Enhanced) ====================
 * 增强版图片渲染器 - 支持9:16比例、单击回调、长按菜单
 */

import React, { useState, useRef, useCallback } from 'react';
import { Image as ImageIcon, ZoomIn, Download, X } from 'lucide-react';
import ImageViewer from './ImageViewer';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined;
  fallbackText?: string;
  aspectRatio?: '9/16' | '3/4' | '1/1' | 'auto';
  onClick?: () => void;
}

const ImageRenderer: React.FC<Props> = ({ 
  src, 
  className, 
  fallbackText, 
  alt,
  aspectRatio = '9/16',
  onClick,
  ...props 
}) => {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  // 转换 COS URL 为 Vite 代理地址
  const getProxiedUrl = (url: string): string => {
    if (!url) return '';
    if (url.includes('cos.ap-guangzhou.myqcloud.com')) {
      const path = url.replace('https://5205210-1320011806.cos.ap-guangzhou.myqcloud.com/', '');
      return `/cos-image/${path}`;
    }
    return url;
  };

  const proxiedSrc = getProxiedUrl(src || '');

  // 获取aspect-ratio样式
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '9/16':
        return 'aspect-[9/16]';
      case '3/4':
        return 'aspect-[3/4]';
      case '1/1':
        return 'aspect-square';
      case 'auto':
      default:
        return '';
    }
  };

  // 处理触摸/鼠标开始
  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isLongPressRef.current = false;
    touchStartTimeRef.current = Date.now();
    
    // 获取点击位置
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    // 记录起始位置
    startPosRef.current = { x: clientX, y: clientY };
    
    // 长按检测（600ms）
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setMenuPosition({ x: clientX, y: clientY });
      setShowMenu(true);
    }, 600);
  }, []);

  // 处理触摸/鼠标结束
  const handleEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // 获取结束位置
    let clientX, clientY;
    if ('changedTouches' in e) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    // 计算移动距离
    const deltaX = Math.abs(clientX - startPosRef.current.x);
    const deltaY = Math.abs(clientY - startPosRef.current.y);
    const movedDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 如果不是长按且移动距离小于10像素，则触发点击事件
    if (!isLongPressRef.current && movedDistance < 10 && onClick) {
      onClick();
    }
    
    isLongPressRef.current = false;
  }, [onClick]);

  // 处理触摸/鼠标移动（取消长按）
  const handleMove = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // 查看大图
  const handleViewImage = () => {
    setShowMenu(false);
    setViewerOpen(true);
  };

  // 下载图片
  const handleDownload = async () => {
    setShowMenu(false);
    try {
      const response = await fetch(proxiedSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lumina-closet-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('下载失败:', err);
    }
  };

  // 直接显示图片URL或base64
  if (!proxiedSrc || hasError) {
    return (
      <div className={`bg-slate-50 flex flex-col items-center justify-center text-slate-300 ${getAspectRatioClass()} ${className}`}>
        <ImageIcon size={24} />
        {fallbackText && <span className="text-[10px] mt-1">{fallbackText}</span>}
        {hasError && <span className="text-[10px] mt-1 text-red-400">加载失败</span>}
      </div>
    );
  }

  return (
    <>
      <div 
        className={`relative overflow-hidden ${getAspectRatioClass()} ${className} ${onClick ? 'cursor-pointer' : ''}`}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseMove={handleMove}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onTouchMove={handleMove}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
          </div>
        )}
        <img 
          src={proxiedSrc} 
          alt={alt || '图片'} 
          className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 select-none`}
          {...props} 
          onLoad={() => setIsLoading(false)}
          onError={(e) => {
            console.error('[ImageRenderer] 图片加载失败:', proxiedSrc);
            setHasError(true);
            setIsLoading(false);
          }} 
          draggable={false}
        />
      </div>

      {/* 长按操作菜单 */}
      {showMenu && (
        <div 
          className="fixed z-[150] bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden"
          style={{
            left: Math.min(menuPosition.x, window.innerWidth - 160),
            top: Math.min(menuPosition.y, window.innerHeight - 100),
          }}
        >
          <div className="flex flex-col">
            <button
              onClick={handleViewImage}
              className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
            >
              <ZoomIn size={18} className="text-indigo-500" />
              <span className="text-sm text-slate-700">查看大图</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-t border-slate-100"
            >
              <Download size={18} className="text-emerald-500" />
              <span className="text-sm text-slate-700">下载图片</span>
            </button>
          </div>
        </div>
      )}

      {/* 点击外部关闭菜单 */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-[140]" 
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* 图片查看器 */}
      <ImageViewer
        src={proxiedSrc}
        alt={alt || '图片'}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
};

export default ImageRenderer;
