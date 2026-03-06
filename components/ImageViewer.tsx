/**
 * ==================== ImageViewer Component ====================
 * 图片查看器 - 支持大图浏览和长按下载
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '../src/context/ToastContext';
import { X, Download } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt = '图片', isOpen, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);
  const [showDownloadHint, setShowDownloadHint] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const { showError } = useToast();

  // 关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setShowControls(true);
      setIsClosing(false);
    }
  }, [isOpen]);

  // 清理长按定时器
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // 处理关闭
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  // 处理图片点击（切换控制栏）
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowControls(!showControls);
  }, [showControls]);

  // 双击放大/缩小
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  }, [scale]);

  // 处理缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.5), 4));
  }, []);

  // 拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [scale, position]);

  // 拖拽中
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, scale]);

  // 拖拽结束
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartTimeRef.current = Date.now();

      // 长按检测（500ms）
      longPressTimerRef.current = setTimeout(() => {
        setShowDownloadHint(true);
        setTimeout(() => setShowDownloadHint(false), 2000);
      }, 500);

      if (scale > 1) {
        setIsDragging(true);
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
      }
    }
  }, [scale, position]);

  // 触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // 移动时取消长按
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (e.touches.length === 1 && isDragging && scale > 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, scale]);

  // 触摸结束
  const handleTouchEnd = useCallback(() => {
    // 清理长按定时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsDragging(false);
    touchStartTimeRef.current = 0;
  }, []);

  // 下载图片
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src);
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
      showError('下载失败，请重试');
    }
  }, [src]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/95 z-[200] flex items-center justify-center overflow-hidden ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onClick={handleClose}
      onWheel={handleWheel}
    >
      {/* 控制栏 */}
      {showControls && (
        <div className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent animate-fade-in">
          <button
            onClick={handleClose}
            className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
          >
            <X size={24} />
          </button>
          <button
            onClick={handleDownload}
            className="h-10 bg-white/10 backdrop-blur-md rounded-full text-white flex items-center gap-2 px-5 hover:bg-white/20 transition-all active:scale-95"
          >
            <Download size={20} />
            <span className="text-sm font-medium">保存</span>
          </button>
        </div>
      )}

      {/* 长按提示 */}
      {showDownloadHint && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-8 py-5 rounded-[2rem] flex flex-col items-center gap-3 animate-fade-in z-50 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Download size={28} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-wide">已触发下载</span>
        </div>
      )}

      {/* 图片容器 */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain select-none shadow-2xl"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onClick={handleImageClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          draggable={false}
        />
      </div>

      {/* 底部提示 */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-fade-in pointer-events-none">
        {/* 缩放比例指示器 */}
        {scale !== 1 && (
          <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-1 rounded-full text-white text-xs font-bold">
            {Math.round(scale * 100)}%
          </div>
        )}
        <div className="bg-white/10 backdrop-blur-md border border-white/10 text-white/50 px-5 py-2 rounded-2xl text-[10px] sm:text-xs">
          双击放大 · 滚轮缩放 · 拖拽移动
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
