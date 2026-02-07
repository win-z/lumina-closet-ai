
import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined;
  fallbackText?: string;
}

const ImageRenderer: React.FC<Props> = ({ src, className, fallbackText, alt, ...props }) => {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // 转换 COS URL 为 Vite 代理地址
  const getProxiedUrl = (url: string): string => {
    if (!url) return '';
    // 如果是 COS 域名，转换为Vite代理地址（避免CORS）
    if (url.includes('cos.ap-guangzhou.myqcloud.com')) {
      const path = url.replace('https://5205210-1320011806.cos.ap-guangzhou.myqcloud.com/', '');
      return `/cos-image/${path}`;
    }
    return url;
  };

  const proxiedSrc = getProxiedUrl(src || '');

  // 直接显示图片URL或base64
  if (!proxiedSrc || hasError) {
    return (
      <div className={`bg-slate-50 flex flex-col items-center justify-center text-slate-300 ${className}`}>
        <ImageIcon size={24} />
        {fallbackText && <span className="text-[10px] mt-1">{fallbackText}</span>}
        {hasError && <span className="text-[10px] mt-1 text-red-400">加载失败</span>}
      </div>
    );
  }

  // 支持 http URL 或 base64 data URL
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
        </div>
      )}
      <img 
        src={proxiedSrc} 
        alt={alt || '图片'} 
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        {...props} 
        onLoad={() => setIsLoading(false)}
        onError={(e) => {
          console.error('[ImageRenderer] 图片加载失败:', proxiedSrc);
          setHasError(true);
          setIsLoading(false);
        }} 
      />
    </div>
  );
};

export default ImageRenderer;
