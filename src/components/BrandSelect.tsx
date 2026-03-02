/**
 * ==================== BrandSelect Component ====================
 * 品牌模糊搜索下拉选择组件
 * - 支持模糊搜索（输入"阿"显示"阿迪达斯"）
 * - 支持输入新品牌自动添加
 * - 支持从现有品牌列表选择
 */

import React, { useState, useRef, useEffect } from 'react';
import { searchBrands, getAllBrands } from '../hooks/common-brands';
import { Search, Plus, X, ChevronDown } from 'lucide-react';

interface BrandSelectProps {
  value: string;
  onChange: (brand: string) => void;
  placeholder?: string;
}

const BrandSelect: React.FC<BrandSelectProps> = ({
  value,
  onChange,
  placeholder = '输入或选择品牌'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 搜索品牌
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchBrands(searchQuery, 10);
      setSuggestions(results);
      
      // 检查是否需要创建新品牌
      const allBrands = getAllBrands();
      const exactMatch = allBrands.find(
        b => b.toLowerCase() === searchQuery.toLowerCase()
      );
      setIsCreatingNew(!exactMatch && searchQuery.length >= 2);
    } else {
      setSuggestions([]);
      setIsCreatingNew(false);
    }
  }, [searchQuery]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理选择品牌
  const handleSelectBrand = (brand: string) => {
    onChange(brand);
    setSearchQuery(brand);
    setIsOpen(false);
    setSuggestions([]);
    setIsCreatingNew(false);
  };

  // 处理创建新品牌
  const handleCreateNew = () => {
    if (searchQuery.trim()) {
      onChange(searchQuery.trim());
      setIsOpen(false);
      setIsCreatingNew(false);
    }
  };

  // 清除选择
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
    setSuggestions([]);
    setIsCreatingNew(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 输入框 */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-20 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X size={14} />
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* 下拉建议列表 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* 搜索建议 */}
          {suggestions.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-xs text-slate-400 uppercase">
                选择品牌
              </div>
              {suggestions.map((brand) => (
                <button
                  key={brand}
                  onClick={() => handleSelectBrand(brand)}
                  className="w-full px-3 py-2 text-left hover:bg-indigo-50 text-sm text-slate-700 flex items-center justify-between"
                >
                  <span>{brand}</span>
                  {brand.toLowerCase() === searchQuery.toLowerCase() && (
                    <span className="text-xs text-indigo-500">匹配</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 创建新品牌选项 */}
          {isCreatingNew && (
            <div className="border-t border-slate-100 py-1">
              <button
                onClick={handleCreateNew}
                className="w-full px-3 py-2 text-left hover:bg-indigo-50 flex items-center gap-2 text-sm"
              >
                <Plus size={16} className="text-indigo-500" />
                <span className="text-indigo-600 font-medium">
                  创建新品牌 "{searchQuery}"
                </span>
              </button>
            </div>
          )}

          {/* 无结果 */}
          {searchQuery && suggestions.length === 0 && !isCreatingNew && (
            <div className="px-3 py-4 text-center text-slate-400 text-sm">
              未找到匹配的品牌
            </div>
          )}

          {/* 默认提示 */}
          {!searchQuery && (
            <div className="px-3 py-2 text-xs text-slate-400">
              输入品牌名称进行搜索，支持模糊匹配
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandSelect;
