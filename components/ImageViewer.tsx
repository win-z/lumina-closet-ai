/**
 * ==================== ImageViewer Component ====================
 * 图片查看器 - 支持大图浏览和长按下载
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  // 关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setShowControls(true);
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
    onClose();
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
      alert('下载失败，请重试');
    }
  }, [src]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center overflow-hidden"
      onClick={handleClose}
      onWheel={handleWheel}
    >
      {/* 控制栏 */}
      {showControls && (
        <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
          <button
            onClick={handleClose}
            className="p-2 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors"
          >
            <X size={24} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors flex items-center gap-2 px-4"
          >
            <Download size={20} />
            <span className="text-sm">下载</span>
          </button>
        </div>
      )}

      {/* 长按提示 */}
      {showDownloadHint && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-slate-800 z-20 shadow-lg">
          长按图片可下载
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
          className="max-w-full max-h-full object-contain transition-transform duration-100 select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
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
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 text-sm text-center">
        <p>双击放大 · 滚轮缩放 · 长按下载</p>
      </div>

      {/* 缩放比例指示器 */}
      {scale !== 1 && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
};

export default ImageViewer;
