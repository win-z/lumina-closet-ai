/**
 * ==================== WardrobeGallery Component (Refactored) ====================
 * 使用 useWardrobe hook 管理衣橱数据
 */

import React, { useState } from 'react';
import { ClothingCategory } from '../types';
import { useWardrobe } from '../src/hooks/useWardrobe';
import { aiApi } from '../services/api';
import ImageRenderer from './ImageRenderer';
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

const WardrobeGallery: React.FC = () => {
  const { items, add, count, getByCategory, update, remove, getById } = useWardrobe();

  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [previewFront, setPreviewFront] = useState<string>('');
  const [previewBack, setPreviewBack] = useState<string>('');
  const [newItem, setNewItem] = useState<Partial<any>>({
    category: ClothingCategory.TOP,
    tags: []
  });
  const [customTagInput, setCustomTagInput] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await resizeImage(file);
      if (side === 'front') {
        setPreviewFront(compressedBase64);
      } else {
        setPreviewBack(compressedBase64);
      }
      
      // AI auto-tag
      if (side === 'front') {
        setAnalyzing(true);
        try {
          const aiResult = await aiApi.autoTag(compressedBase64);
          setNewItem(prev => ({
            ...prev,
            name: aiResult.name || prev.name,
            color: aiResult.color || prev.color,
            category: aiResult.category || prev.category,
            tags: [...new Set([...(prev.tags || []), ...(aiResult.tags || [])])]
          }));
        } catch (e) {
          console.error('AI分析失败:', e);
        } finally {
          setAnalyzing(false);
        }
      }
    } catch (e) {
      console.error('图片处理失败:', e);
      alert('图片处理失败，请重试');
    }
  };

  const saveItem = async () => {
    if (!previewFront || !newItem.name) {
      alert("请上传正面图片并填写名称");
      return;
    }

    try {
      setAnalyzing(true);

      if (editingItem) {
        // 更新现有单品
        await update(editingItem, {
          ...newItem,
          imageFront: previewFront,
          imageBack: previewBack || undefined,
        } as any);
      } else {
        // 添加新单品
        await add({
          ...newItem,
          imageFront: previewFront,
          imageBack: previewBack || undefined,
        } as any);
      }

      // Reset form
      setIsUploading(false);
      setIsEditing(false);
      setEditingItem('');
      setNewItem({ category: ClothingCategory.TOP, tags: [] });
      setPreviewFront('');
      setPreviewBack('');
      setCustomTagInput("");
    } catch (e: any) {
      alert(`${editingItem ? '更新' : '保存'}失败: ${e?.message || "未知错误"}`);
    } finally {
      setAnalyzing(false);
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
    setPreviewBack(item.imageBack || '');
    setIsEditing(true);
    setIsUploading(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这件单品吗？')) return;

    try {
      await remove(id);
    } catch (e: any) {
      alert(`删除失败: ${e?.message || "未知错误"}`);
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

  // Group items by category
  const groupedItems = Object.values(ClothingCategory).reduce((acc, category) => {
    acc[category] = getByCategory(category);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-4 pb-28 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold font-serif text-slate-800">我的衣橱</h2>
          <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
            {count} 件单品
          </span>
        </div>
        <button 
          onClick={() => setIsUploading(true)}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-110 transition-transform"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Categories */}
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        categoryItems.length > 0 && (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                {category} · {categoryItems.length}个
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {categoryItems.map(item => (
                <div key={item.id} className="space-y-1">
                  {/* 图片区域 - 单击编辑，长按菜单 */}
                  <div className="aspect-[9/16] bg-slate-50 rounded-lg overflow-hidden relative group shadow-sm border border-slate-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                    >
                      <Trash2 size={12} />
                    </button>
                    <ImageRenderer
                      src={item.imageFront || item.imageBack}
                      alt={item.name || '未命名'}
                      aspectRatio="9/16"
                      onClick={() => handleEdit(item)}
                      className="w-full h-full mix-blend-multiply transition-transform group-hover:scale-105"
                    />
                  </div>

                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {/* Empty State */}
      {count === 0 && !isUploading && (
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
      )}

      {/* Upload Modal */}
      {isUploading && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center">
          {/* 遮罩背景 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
            setIsUploading(false);
            setIsEditing(false);
            setEditingItem('');
          }} />
          {/* 弹窗内容 - 严格限制在上下菜单之间 */}
          <div className="relative w-full max-w-[calc(393px-32px)] mx-4 mt-[72px] mb-[88px] max-h-[calc(852px-160px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">正面照片 *</label>
                  <div className="aspect-[3/4] bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
                    {previewFront ? (
                      <img src={previewFront} alt="正面" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={24} className="text-slate-400 mb-2" />
                        <span className="text-sm text-slate-400">点击上传</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'front')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">背面照片</label>
                  <div className="aspect-[3/4] bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
                    {previewBack ? (
                      <img src={previewBack} alt="背面" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={24} className="text-slate-400 mb-2" />
                        <span className="text-sm text-slate-400">点击上传</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'back')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
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
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">标签</label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        newItem.tags?.includes(tag)
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
                    setPreviewBack('');
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
      )}
    </div>
  );
};

export default WardrobeGallery;
