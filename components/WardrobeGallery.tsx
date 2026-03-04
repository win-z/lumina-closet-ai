/**
 * ==================== WardrobeGallery Component (Refactored) ====================
 * 使用 useWardrobe hook 管理衣橱数据
 */

import React, { useState } from 'react';
import { ClothingCategory } from '../types';
import { useWardrobe } from '../src/hooks/useWardrobe';
import { useToast } from '../src/context/ToastContext';
import { aiApi } from '../services/api';
import ImageRenderer from './ImageRenderer';
import BrandSelect from '../src/components/BrandSelect';
import { Camera, Plus, X, Trash2, Search, ChevronDown, Loader2 } from 'lucide-react';

const COMMON_TAGS = ["休闲", "商务", "运动", "复古", "极简", "约会", "度假", "春", "夏", "秋", "冬"];

// Helper to resize and compress image
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const CATEGORY_PAGE_SIZE = 8; // 每个品类默认展示数量

const WardrobeGallery: React.FC = () => {
  const { items, add, count, getByCategory, update, remove, getById } = useWardrobe();
  const { showError, showSuccess, showConfirm } = useToast();

  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewFront, setPreviewFront] = useState<string>('');
  const [newItem, setNewItem] = useState<Partial<any>>({
    category: ClothingCategory.TOP,
    tags: []
  });
  const [customTagInput, setCustomTagInput] = useState("");
  // 展开状态：记录每个品类是否展开全部
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleExpand = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await resizeImage(file);
      setPreviewFront(compressedBase64);

      // AI auto-tag
      setAnalyzing(true);
      try {
        const aiResult = await aiApi.autoTag(compressedBase64);
        setNewItem(prev => ({
          ...prev,
          name: aiResult.name || prev.name,
          color: aiResult.color || prev.color,
          category: aiResult.category || prev.category,
          brand: aiResult.brand || prev.brand, // AI识别品牌
          tags: [...new Set([...(prev.tags || []), ...(aiResult.tags || [])])]
        }));
      } catch (e) {
        console.error('AI分析失败:', e);
      } finally {
        setAnalyzing(false);
      }
    } catch (e) {
      console.error('图片处理失败:', e);
      showError('图片处理失败，请重试');
    }
  };

  const saveItem = async () => {
    if (!previewFront || !newItem.name) {
      showError("请上传正面图片并填写名称");
      return;
    }

    try {
      // 保存时不需要再次AI分析，AI分析已在上传图片时完成

      if (editingItem) {
        // 更新现有单品
        await update(editingItem, {
          ...newItem,
          imageFront: previewFront,
        } as any);
        showSuccess("单品更新成功");
      } else {
        // 添加新单品
        await add({
          ...newItem,
          imageFront: previewFront,
        } as any);
        showSuccess("单品入库成功");
      }

      // Reset form
      setIsUploading(false);
      setIsEditing(false);
      setEditingItem('');
      setNewItem({ category: ClothingCategory.TOP, tags: [] });
      setPreviewFront('');
      setCustomTagInput("");
    } catch (e: any) {
      showError(`${editingItem ? '更新' : '保存'}失败: ${e?.message || "未知错误"}`);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item.id);
    setNewItem({
      name: item.name,
      category: item.category,
      color: item.color,
      brand: item.brand,
      price: item.price,
      purchaseDate: item.purchaseDate,
      tags: item.tags || [],
    });
    setPreviewFront(item.imageFront);
    setIsEditing(true);
    setIsUploading(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: '删除单品',
      message: '确定要删除这件单品吗？删除后无法恢复。',
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await remove(id);
      showSuccess("单品删除成功");
    } catch (e: any) {
      showError(`删除失败: ${e?.message || "未知错误"}`);
    }
  };

  const toggleTag = (tag: string) => {
    setNewItem(prev => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...(prev.tags || []), tag]
    }));
  };

  // 搜索过滤
  const filteredItems = searchQuery.trim()
    ? items.filter(item => {
      const q = searchQuery.trim().toLowerCase();
      return (
        item.name?.toLowerCase().includes(q) ||
        item.color?.toLowerCase().includes(q) ||
        item.brand?.toLowerCase().includes(q) ||
        item.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    })
    : [];

  // Group items by category
  const groupedItems = Object.values(ClothingCategory).reduce((acc, category) => {
    acc[category] = getByCategory(category);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-4 pb-28 space-y-6">
      {/* Header */}
      {isSearching ? (
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl">
            <Search size={16} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索名称、颜色、品牌、标签..."
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => { setIsSearching(false); setSearchQuery(''); }}
            className="text-slate-500 text-sm font-medium px-2"
          >
            取消
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-serif text-slate-800">我的衣橱</h2>
            <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
              {count} 件单品
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearching(true)}
              className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => setIsUploading(true)}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-rose-500 to-indigo-500 text-white flex items-center justify-center hover:shadow-lg transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      )
      }


      {/* 搜索结果 */}
      {
        searchQuery.trim() ? (
          filteredItems.length > 0 ? (
            <>
              <p className="text-sm text-slate-500">
                找到 <span className="font-medium text-slate-700">{filteredItems.length}</span> 件单品
              </p>
              <div className="grid grid-cols-4 gap-3">
                {filteredItems.map(item => (
                  <div key={item.id} className="space-y-1">
                    <div className="aspect-[9/16] bg-slate-50 rounded-lg overflow-hidden relative group shadow-sm border border-slate-50">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                      >
                        <Trash2 size={12} />
                      </button>
                      <ImageRenderer
                        src={item.imageFront}
                        alt={item.name || '未命名'}
                        aspectRatio="9/16"
                        onClick={() => handleEdit(item)}
                        className="w-full h-full mix-blend-multiply transition-transform group-hover:scale-105"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 truncate text-center">{item.name}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Search size={36} className="mx-auto mb-3 opacity-40" />
              <p>没有找到匹配的单品</p>
              <p className="text-sm mt-1">尝试搜索名称、颜色或品牌</p>
            </div>
          )
        ) : (
          /* 分类视图 */
          <>
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              categoryItems.length > 0 && (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      {category} · {categoryItems.length}个
                    </h3>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {(expandedCategories.has(category) ? categoryItems : categoryItems.slice(0, CATEGORY_PAGE_SIZE)).map(item => (
                      <div key={item.id} className="space-y-1">
                        <div className="aspect-[9/16] bg-slate-50 rounded-lg overflow-hidden relative group shadow-sm border border-slate-50">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                          >
                            <Trash2 size={12} />
                          </button>
                          <ImageRenderer
                            src={item.imageFront}
                            alt={item.name || '未命名'}
                            aspectRatio="9/16"
                            onClick={() => handleEdit(item)}
                            className="w-full h-full mix-blend-multiply transition-transform group-hover:scale-105"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {categoryItems.length > CATEGORY_PAGE_SIZE && (
                    <button
                      onClick={() => toggleExpand(category)}
                      className="w-full py-2 text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center justify-center gap-1"
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${expandedCategories.has(category) ? 'rotate-180' : ''}`}
                      />
                      {expandedCategories.has(category)
                        ? '收起'
                        : `展开剩余 ${categoryItems.length - CATEGORY_PAGE_SIZE} 件`}
                    </button>
                  )}
                </div>
              )
            ))}
          </>
        )
      }

      {/* Empty State */}
      {
        count === 0 && !isUploading && (
          <div className="text-center py-12 text-slate-400">
            <Camera size={48} className="mx-auto mb-4 opacity-50" />
            <p>衣橱空空如也</p>
            <button
              onClick={() => setIsUploading(true)}
              className="mt-4 text-indigo-500 hover:text-indigo-600 font-medium"
            >
              添加第一件单品
            </button>
          </div>
        )
      }

      {/* Upload Modal */}
      {
        isUploading && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center">
            {/* 遮罩背景 */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
              setIsUploading(false);
              setIsEditing(false);
              setEditingItem('');
            }} />
            {/* 弹窗内容 - 严格限制在上下菜单之间 */}
            <div className="relative w-full max-w-[calc(393px-32px)] mx-4 mt-[72px] mb-[88px] max-h-[calc(100dvh-160px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingItem ? '编辑单品' : '添加新单品'}
                </h3>
                <button
                  onClick={() => {
                    setIsUploading(false);
                    setIsEditing(false);
                    setEditingItem('');
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">照片 *</label>
                  <div className="aspect-[3/4] bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
                    {previewFront ? (
                      <img src={previewFront} alt="服装照片" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={24} className="text-slate-400 mb-2" />
                        <span className="text-sm text-slate-400">点击上传</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* AI Analyzing */}
                {analyzing && (
                  <div className="flex items-center gap-2 text-indigo-500 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    <span>AI 分析中...</span>
                  </div>
                )}

                {/* Basic Info */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">名称 *</label>
                    <input
                      type="text"
                      value={newItem.name || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="例如：白色T恤"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">类别</label>
                      <select
                        value={newItem.category}
                        onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      >
                        {Object.values(ClothingCategory).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">颜色</label>
                      <input
                        type="text"
                        value={newItem.color || ''}
                        onChange={(e) => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="例如：白色"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      />
                    </div>
                  </div>

                  {/* 品牌和价格 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">品牌</label>
                      <BrandSelect
                        value={newItem.brand || ''}
                        onChange={(brand) => setNewItem(prev => ({ ...prev, brand }))}
                        placeholder="选择或输入品牌"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">价格 (¥)</label>
                      <input
                        type="number"
                        value={newItem.price || ''}
                        onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value ? Number(e.target.value) : undefined }))}
                        placeholder="例如：299"
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      />
                    </div>
                  </div>

                  {/* 购买日期 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">购买日期</label>
                    <input
                      type="date"
                      value={newItem.purchaseDate || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">标签</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${newItem.tags?.includes(tag)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      placeholder="自定义标签"
                      className="flex-1 px-3 py-1 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && customTagInput.trim()) {
                          toggleTag(customTagInput.trim());
                          setCustomTagInput('');
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (customTagInput.trim()) {
                          toggleTag(customTagInput.trim());
                          setCustomTagInput('');
                        }
                      }}
                      className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200"
                    >
                      添加
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-4 pb-20 space-y-3">
                  <button
                    onClick={saveItem}
                    disabled={analyzing || !previewFront || !newItem.name}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzing ? '处理中...' : (editingItem ? '保存更改' : '确认入库')}
                  </button>
                  <button
                    onClick={() => {
                      setIsUploading(false);
                      setIsEditing(false);
                      setEditingItem('');
                      setPreviewFront('');
                      setNewItem({ category: ClothingCategory.TOP, tags: [] });
                    }}
                    className="w-full py-3 bg-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-300 transition-all"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default WardrobeGallery;
