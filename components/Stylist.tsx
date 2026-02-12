/**
 * ==================== Stylist Component (Refactored) ====================
 * 使用 hooks 管理数据
 */

import React, { useState } from 'react';
import { useWardrobe } from '../src/hooks/useWardrobe';
import { useProfile } from '../src/hooks/useProfile';
import { useDiary } from '../src/hooks/useDiary';
import { useApp } from '../src/context/AppContext';
import { useToast } from '../src/context/ToastContext';
import { aiApi, outfitsApi } from '../services/api';
import ImageRenderer from './ImageRenderer';
import { Sparkles, CloudSun, Calendar, RefreshCw, BookmarkPlus, Trash2, Edit, Plus, X, Camera, Upload } from 'lucide-react';
import { ClothingCategory } from '../types';

const Stylist: React.FC = () => {
  const { items: wardrobe, getById } = useWardrobe();
  const { profile } = useProfile();
  const { add: addToDiary } = useDiary();
  const { user, loadUserData } = useApp();
  const { showSuccess, showError, showConfirm } = useToast();

  const [activeTab, setActiveTab] = useState<'generate' | 'saved'>('generate');
  const [weather, setWeather] = useState("晴天, 24°C");
  const [occasion, setOccasion] = useState("周末约会");
  const [suggestion, setSuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [savedOutfits, setSavedOutfits] = useState<any[]>([]);
  const [editingOutfit, setEditingOutfit] = useState<any>(null);
  const [customName, setCustomName] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 手动选择模式
  const [manualMode, setManualMode] = useState(false);
  const [selectedTops, setSelectedTops] = useState<string[]>([]);
  const [selectedBottoms, setSelectedBottoms] = useState<string[]>([]);
  const [selectedDress, setSelectedDress] = useState<string | null>(null);
  const [selectedShoes, setSelectedShoes] = useState<string[]>([]);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [realPhoto, setRealPhoto] = useState<string>(''); // 上传的真实穿着图

  // 加载已保存搭配
  const loadSavedOutfits = async () => {
    console.log('loadSavedOutfits 被调用');
    try {
      setError(null);
      const outfits = await outfitsApi.getAll();
      console.log('获取到搭配数量:', outfits?.length || 0);
      setSavedOutfits(outfits || []);
    } catch (e: any) {
      console.error('加载已保存搭配失败:', e);
      setError(e?.message || '加载失败，请重新登录');
    }
  };

  // 组件挂载时加载数据（用于显示正确的计数）
  React.useEffect(() => {
    loadSavedOutfits();
  }, []);

  // 切换到已保存标签时加载数据（刷新最新数据）
  React.useEffect(() => {
    if (activeTab === 'saved') {
      console.log('Loading saved outfits...');
      try {
        loadSavedOutfits();
      } catch (e) {
        console.error('loadSavedOutfits error:', e);
      }
    }
  }, [activeTab]);

  // 错误边界组件
  if (error) {
    return (
      <div className="p-4 pb-28 space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadSavedOutfits();
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  const getSuggestion = async () => {
    if (wardrobe.length < 2) {
      showError("请先在衣橱中添加一些衣物！");
      return;
    }
    setLoading(true);
    setSuggestion(null);
    try {
      const result = await aiApi.outfit(weather, occasion);
      setSuggestion(result);
    } catch (e) {
      console.error(e);
      showError("生成搭配失败，请检查网络或Key。");
    } finally {
      setLoading(false);
    }
  };

  // 处理上传真实穿着照片
  const handleRealPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setRealPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 切换选择（多选）
  const toggleSelection = (id: string, selectedList: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (selectedList.includes(id)) {
      setSelected(selectedList.filter(itemId => itemId !== id));
    } else {
      setSelected([...selectedList, id]);
    }
  };

  // 手动选择生成试穿图或使用真实照片
  const handleManualGenerate = async () => {
    // 验证：有连衣裙，或者有上装+下装
    const hasDress = selectedDress !== null;
    const hasTopAndBottom = selectedTops.length > 0 || selectedBottoms.length > 0;
    
    if (!hasDress && !hasTopAndBottom) {
      showError("请选择连衣裙，或者选择上装/下装！");
      return;
    }

    // 如果上传了真实照片，直接使用
    if (realPhoto) {
      setSuggestion({
        dressId: selectedDress,
        topIds: selectedTops,
        bottomIds: selectedBottoms,
        shoesIds: selectedShoes,
        tryOnImage: realPhoto,
        reasoning: "用户上传的真实穿着照片",
      });
      return;
    }
    
    if (!profile?.photoFront) {
      showError("请先上传身体档案照片，或上传真实穿着照片！");
      return;
    }

    setLoading(true);
    try {
      // 传递手动选择的服装ID
      // 如果有连衣裙，优先使用连衣裙；否则使用上装+下装
      const result = await aiApi.outfit(
        weather, 
        occasion, 
        selectedDress || selectedTops[0], 
        selectedDress ? undefined : selectedBottoms[0], 
        selectedShoes[0]
      );
      setSuggestion(result);
    } catch (e) {
      console.error(e);
      showError("生成试穿图失败，请检查网络。");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToOutfit = async () => {
    if (!suggestion) return;

    try {
      console.log('开始保存搭配...');
      // 处理多选情况，将数组转为逗号分隔的字符串存储，或只取第一个
      const dressId = suggestion.dressId;
      const topId = !dressId ? (suggestion.topIds ? suggestion.topIds[0] : suggestion.topId) : undefined;
      const bottomId = !dressId ? (suggestion.bottomIds ? suggestion.bottomIds[0] : suggestion.bottomId) : undefined;
      const shoesId = suggestion.shoesIds ? suggestion.shoesIds[0] : suggestion.shoesId;
      
      await outfitsApi.save({
        name: customName || undefined,
        tags: customTags,
        weather,
        occasion,
        dressId,
        topId,
        bottomId,
        shoesId,
        reasoning: suggestion.reasoning,
        tryonImage: suggestion.tryOnImage || undefined,
      });
      console.log('保存成功');
      showSuccess("已保存到已保存搭配！");
      // 清空并刷新
      setSuggestion(null);
      setCustomName('');
      setCustomTags([]);
      setSelectedTops([]);
      setSelectedBottoms([]);
      setSelectedDress(null);
      setSelectedShoes([]);
      setSelectedAccessories([]);
      setManualMode(false);
      setActiveTab('saved');
      // 强制刷新已保存搭配列表
      setTimeout(() => {
        console.log('刷新已保存搭配列表');
        loadSavedOutfits();
      }, 200);
    } catch (e: any) {
      console.error("保存失败", e);
      showError("保存失败: " + (e?.message || '未知错误'));
    }
  };

  const handleEditOutfit = (entry: any) => {
    setEditingOutfit(entry);
    setCustomName(entry.name || '');
    setCustomTags(entry.tags || []);
  };

  // 删除搭配
  const handleDeleteOutfit = async (id: string) => {
    const confirmed = await showConfirm({
      title: '删除搭配',
      message: '确定要删除这个搭配吗？删除后无法恢复。',
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await outfitsApi.delete(id);
      showSuccess("搭配已删除！");
      loadSavedOutfits();
    } catch (e: any) {
      console.error("删除失败", e);
      showError("删除失败: " + (e?.message || '未知错误'));
    }
  };

  const handleSaveEditedOutfit = async () => {
    if (!editingOutfit) return;

    try {
      await outfitsApi.save({
        name: customName || undefined,
        tags: customTags,
        weather: editingOutfit.weather,
        occasion: editingOutfit.occasion,
        topId: editingOutfit.topId,
        bottomId: editingOutfit.bottomId,
        shoesId: editingOutfit.shoesId,
        reasoning: editingOutfit.reasoning,
        tryonImage: editingOutfit.tryonImage || undefined,
      });
      showSuccess("搭配已更新！");
      setEditingOutfit(null);
      setCustomName('');
      setCustomTags([]);
      loadSavedOutfits();
    } catch (e) {
      console.error("更新失败", e);
      showError("更新失败");
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !customTags.includes(tagInput.trim())) {
      setCustomTags([...customTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setCustomTags(customTags.filter(t => t !== tag));
  };

  const getItem = (id: string) => getById(id);

  // 按类别筛选服装
  const tops = wardrobe.filter(item => item.category === ClothingCategory.TOP || item.category === '上装');
  const bottoms = wardrobe.filter(item => item.category === ClothingCategory.BOTTOM || item.category === '下装');
  const dresses = wardrobe.filter(item => item.category === ClothingCategory.DRESS || item.category === '连衣裙');
  const shoes = wardrobe.filter(item => item.category === ClothingCategory.SHOES || item.category === '鞋履');
  const accessories = wardrobe.filter(item => 
    item.category === ClothingCategory.ACCESSORY || 
    item.category === '配饰' ||
    item.category === ClothingCategory.OUTERWEAR ||
    item.category === '外套'
  );

  return (
    <div className="p-4 pb-28 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold font-serif text-slate-800">AI搭配师</h2>
        <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-xs font-bold uppercase">AI</span>
      </div>

      {/* Tab切换 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setActiveTab('generate');
            setEditingOutfit(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'generate'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sparkles size={16} />
          <span>生成搭配</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('saved');
            setSuggestion(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'saved'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookmarkPlus size={16} />
          <span>已保存搭配 ({savedOutfits.length})</span>
        </button>
      </div>

      {/* 生成搭配Tab */}
      {activeTab === 'generate' && (
        <>
          {/* 模式切换 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setManualMode(false);
                setSuggestion(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                !manualMode
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🤖 AI推荐
            </button>
            <button
              onClick={() => {
                setManualMode(true);
                setSuggestion(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                manualMode
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ✋ 手动选择
            </button>
          </div>

          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                <CloudSun size={16} className="inline mr-1" /> 天气
              </label>
              <input
                type="text"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                placeholder="例如：晴天, 24°C"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                <Calendar size={16} className="inline mr-1" /> 场合
              </label>
              <input
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                placeholder="例如：周末约会"
              />
            </div>

            {/* 手动选择模式 - 服装选择器 */}
            {manualMode && (
              <div className="space-y-4 border-t border-slate-100 pt-4">
                {/* 连衣裙选择 */}
                {dresses.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      连衣裙
                      <span className="text-xs text-slate-400 ml-2">(选择连衣裙后无需选择上装/下装)</span>
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {dresses.map(item => (
                        <div
                          key={item.id}
                          className={`flex-shrink-0 relative ${selectedDress === item.id ? 'ring-2 ring-pink-500 rounded-lg' : ''}`}
                        >
                          <div className="aspect-[9/16] w-20 rounded-lg overflow-hidden bg-slate-50">
                            <ImageRenderer
                              src={item.imageFront}
                              alt={item.name}
                              aspectRatio="9/16"
                              onClick={() => {
                                if (selectedDress === item.id) {
                                  setSelectedDress(null);
                                } else {
                                  setSelectedDress(item.id);
                                  // 选择连衣裙时清空上装和下装
                                  setSelectedTops([]);
                                  setSelectedBottoms([]);
                                }
                              }}
                              className="w-full h-full"
                            />
                          </div>
                          {selectedDress === item.id && (
                            <div className="absolute inset-0 bg-pink-500/20 rounded-lg flex items-center justify-center pointer-events-none">
                              <span className="text-pink-600 font-bold text-lg">✓</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 上装选择 - 有连衣裙时禁用 */}
                <div className={selectedDress ? 'opacity-50 pointer-events-none' : ''}>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    上装
                    {selectedDress && <span className="text-xs text-pink-500 ml-2">(已选择连衣裙)</span>}
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {tops.length === 0 ? (
                      <span className="text-sm text-slate-400">衣橱中没有上装</span>
                    ) : (
                      tops.map(item => (
                        <div
                          key={item.id}
                          className={`flex-shrink-0 relative ${selectedTops.includes(item.id) ? 'ring-2 ring-indigo-500 rounded-lg' : ''}`}
                        >
                          <div className="aspect-[9/16] w-20 rounded-lg overflow-hidden bg-slate-50">
                            <ImageRenderer
                              src={item.imageFront}
                              alt={item.name}
                              aspectRatio="9/16"
                              onClick={() => toggleSelection(item.id, selectedTops, setSelectedTops)}
                              className="w-full h-full"
                            />
                          </div>
                          {selectedTops.includes(item.id) && (
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-lg flex items-center justify-center pointer-events-none">
                              <span className="text-indigo-600 font-bold text-lg">✓</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 下装选择 - 有连衣裙时禁用 */}
                <div className={selectedDress ? 'opacity-50 pointer-events-none' : ''}>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      下装
                      {selectedDress && <span className="text-xs text-pink-500 ml-2">(已选择连衣裙)</span>}
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {bottoms.length === 0 ? (
                        <span className="text-sm text-slate-400">衣橱中没有下装</span>
                      ) : (
                        bottoms.map(item => (
                          <div
                            key={item.id}
                            className={`flex-shrink-0 relative ${selectedBottoms.includes(item.id) ? 'ring-2 ring-indigo-500 rounded-lg' : ''}`}
                          >
                            <div className="aspect-[9/16] w-20 rounded-lg overflow-hidden bg-slate-50">
                              <ImageRenderer
                                src={item.imageFront}
                                alt={item.name}
                                aspectRatio="9/16"
                                onClick={() => toggleSelection(item.id, selectedBottoms, setSelectedBottoms)}
                                className="w-full h-full"
                              />
                            </div>
                            {selectedBottoms.includes(item.id) && (
                              <div className="absolute inset-0 bg-indigo-500/20 rounded-lg flex items-center justify-center pointer-events-none">
                                <span className="text-indigo-600 font-bold text-lg">✓</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 鞋履选择 */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">鞋履</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {shoes.length === 0 ? (
                      <span className="text-sm text-slate-400">衣橱中没有鞋履</span>
                    ) : (
                      shoes.map(item => (
                        <div
                          key={item.id}
                          className={`flex-shrink-0 relative ${selectedShoes.includes(item.id) ? 'ring-2 ring-indigo-500 rounded-lg' : ''}`}
                        >
                          <div className="aspect-[9/16] w-20 rounded-lg overflow-hidden bg-slate-50">
                            <ImageRenderer
                              src={item.imageFront}
                              alt={item.name}
                              aspectRatio="9/16"
                              onClick={() => toggleSelection(item.id, selectedShoes, setSelectedShoes)}
                              className="w-full h-full"
                            />
                          </div>
                          {selectedShoes.includes(item.id) && (
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-lg flex items-center justify-center pointer-events-none">
                              <span className="text-indigo-600 font-bold text-lg">✓</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 已选择展示 */}
                {(selectedDress || selectedTops.length > 0 || selectedBottoms.length > 0 || selectedShoes.length > 0) && (
                  <div className="bg-indigo-50 rounded-xl p-3">
                    <p className="text-sm font-medium text-indigo-700 mb-2">已选择：</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDress && (
                        <span className="px-2 py-1 bg-white text-pink-600 rounded-full text-xs font-medium">
                          连衣裙: {getById(selectedDress)?.name}
                        </span>
                      )}
                      {selectedTops.map(id => (
                        <span key={id} className="px-2 py-1 bg-white text-indigo-600 rounded-full text-xs">
                          上装: {getById(id)?.name}
                        </span>
                      ))}
                      {selectedBottoms.map(id => (
                        <span key={id} className="px-2 py-1 bg-white text-indigo-600 rounded-full text-xs">
                          下装: {getById(id)?.name}
                        </span>
                      ))}
                      {selectedShoes.map(id => (
                        <span key={id} className="px-2 py-1 bg-white text-indigo-600 rounded-full text-xs">
                          鞋履: {getById(id)?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 上传真实穿着照片 */}
                <div className="border-t border-slate-200 pt-4">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    <Upload size={14} className="inline mr-1" />
                    上传真实穿着照片（可选）
                  </label>
                  
                  {realPhoto ? (
                    <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-100">
                      <ImageRenderer
                        src={realPhoto}
                        alt="真实穿着照片"
                        aspectRatio="9/16"
                        className="w-full h-full"
                      />
                      <button
                        onClick={() => setRealPhoto('')}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                      <div className="absolute bottom-2 left-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg text-center">
                        将使用此照片作为穿着效果
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[9/16] bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative overflow-hidden">
                      <Camera size={32} className="text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500">点击上传真实穿着照</span>
                      <span className="text-xs text-slate-400 mt-1">或使用AI生成试穿图</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleRealPhotoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleManualGenerate}
                  disabled={loading || (!selectedDress && selectedTops.length === 0 && selectedBottoms.length === 0)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw size={20} className="animate-spin" />
                  ) : realPhoto ? (
                    <Camera size={20} />
                  ) : (
                    <Sparkles size={20} />
                  )}
                  {loading ? '生成中...' : realPhoto ? '使用真实照片' : '生成试穿图'}
                </button>
              </div>
            )}

            {/* AI推荐模式的生成按钮 */}
            {!manualMode && (
              <button
                onClick={getSuggestion}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Sparkles size={20} />
                )}
                {loading ? '生成中...' : '获取搭配建议'}
              </button>
            )}
          </div>

          {/* Suggestion Display */}
          {suggestion && (
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{manualMode ? '试穿效果' : '推荐搭配'}</h3>
                <button
                  onClick={handleSaveToOutfit}
                  className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 text-sm"
                >
                  <BookmarkPlus size={16} />
                  保存到搭配
                </button>
              </div>

              {/* Custom Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">搭配名称</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="给搭配起个名字..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">标签</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {customTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => removeTag(tag)}
                        className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm hover:bg-indigo-200"
                      >
                        {tag} <span className="ml-1">×</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="添加标签..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') addTag();
                      }}
                      className="flex-1 px-3 py-1 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                    />
                    <button
                      onClick={addTag}
                      className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>

              {/* Outfit Items - 支持单选和多选 */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {/* 连衣裙 - 支持单选或多选 */}
                {(suggestion.dressId || suggestion.dressIds?.length > 0) && (
                  <>
                    {suggestion.dressIds ? (
                      // 多选模式
                      suggestion.dressIds.map((id: string) => (
                        <div key={id} className="flex-shrink-0">
                          <div className="aspect-[9/16] w-28 rounded-lg overflow-hidden bg-slate-50 mb-1">
                            <ImageRenderer
                              src={getItem(id)?.imageFront}
                              alt="连衣裙"
                              aspectRatio="9/16"
                              className="w-full h-full"
                            />
                          </div>
                          <span className="text-xs text-slate-500">{getItem(id)?.name || '连衣裙'}</span>
                        </div>
                      ))
                    ) : (
                      // 单选模式
                      <div className="flex-shrink-0">
                        <div className="aspect-[9/16] w-28 rounded-lg overflow-hidden bg-slate-50 mb-1">
                          <ImageRenderer
                            src={getItem(suggestion.dressId)?.imageFront}
                            alt="连衣裙"
                            aspectRatio="9/16"
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-xs text-slate-500">连衣裙</span>
                      </div>
                    )}
                  </>
                )}

                {/* 上装 - 支持单选(suggestion.topId)或多选(suggestion.topIds) */}
                {(suggestion.topId || suggestion.topIds?.length > 0) && (
                  <>
                    {suggestion.topIds ? (
                      // 多选模式
                      suggestion.topIds.map((id: string) => (
                        <div key={id} className="flex-shrink-0">
                          <div className="aspect-[9/16] w-28 rounded-lg overflow-hidden bg-slate-50 mb-1">
                            <ImageRenderer
                              src={getItem(id)?.imageFront}
                              alt="上装"
                              aspectRatio="9/16"
                              className="w-full h-full"
                            />
                          </div>
                          <span className="text-xs text-slate-500">{getItem(id)?.name || '上装'}</span>
                        </div>
                      ))
                    ) : (
                      // 单选模式
                      <div className="flex-shrink-0">
                        <div className="aspect-[9/16] w-28 rounded-lg overflow-hidden bg-slate-50 mb-1">
                          <ImageRenderer
                            src={getItem(suggestion.topId)?.imageFront}
                            alt="上装"
                            aspectRatio="9/16"
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-xs text-slate-500">上装</span>
                      </div>
                    )}
                  </>
                )}
                
                {/* 下装 - 支持单选或多选 */}
                {(suggestion.bottomId || suggestion.bottomIds?.length > 0) && (
                  <>
                    {suggestion.bottomIds ? (
                      suggestion.bottomIds.map((id: string) => (
                        <div key={id} className="flex-shrink-0">
                          <div className="aspect-[9/16] w-28 rounded-lg overflow-hidden bg-slate-50 mb-1">
                            <ImageRenderer
                              src={getItem(id)?.imageFront}
                              alt="下装"
                              aspectRatio="9/16"
                              className="w-full h-full"
                            />
                          </div>
                          <span className="text-xs text-slate-500">{getItem(id)?.name || '下装'}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex-shrink-0">
                        <div className="aspect-[9/16] w-28 rounded-lg overflow-hidden bg-slate-50 mb-1">
                          <ImageRenderer
                            src={getItem(suggestion.bottomId)?.imageFront}
                            alt="下装"
                            aspectRatio="9/16"
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-xs text-slate-500">下装</span>
                      </div>
                    )}
                  </>
                )}
                
                {/* 鞋履 - 支持单选或多选 */}
                {(suggestion.shoesId || suggestion.shoesIds?.length > 0) && (
                  <>
                    {suggestion.shoesIds ? (
                      suggestion.shoesIds.map((id: string) => (
                        <div key={id} className="flex-shrink-0">
                          <div className="aspect-[9/16] w-28 rounded-lg overflow-hidden bg-slate-50 mb-1">
                            <ImageRenderer
                              src={getItem(id)?.imageFront}
                              alt="鞋履"
                              aspectRatio="9/16"
                              className="w-full h-full"
                            />
                          </div>
                          <span className="text-xs text-slate-500">{getItem(id)?.name || '鞋履'}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex-shrink-0">
                        <div className="aspect-[9/16] w-28 rounded-lg overflow-hidden bg-slate-50 mb-1">
                          <ImageRenderer
                            src={getItem(suggestion.shoesId)?.imageFront}
                            alt="鞋履"
                            aspectRatio="9/16"
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-xs text-slate-500">鞋履</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Try-On Image */}
              {suggestion.tryOnImage && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">试穿效果</p>
                  <div className="w-full aspect-[9/16] rounded-xl overflow-hidden bg-slate-100">
                    <ImageRenderer
                      src={suggestion.tryOnImage}
                      alt="试穿效果"
                      aspectRatio="9/16"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}

              {/* Reasoning */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 leading-relaxed">{suggestion.reasoning}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* 已保存搭配Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          {savedOutfits.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <BookmarkPlus size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">还没有保存的搭配</p>
              <p className="text-sm text-slate-400">切换到"生成搭配"标签，让AI为你推荐搭配</p>
            </div>
          ) : (
            Object.entries(savedOutfits.reduce<Record<string, any[]>>((acc, outfit) => {
              // 按标签分组
              if (outfit.tags && outfit.tags.length > 0) {
                outfit.tags.forEach((tag: string) => {
                  if (!acc[tag]) acc[tag] = [];
                  acc[tag].push(outfit);
                });
              } else {
                if (!acc['未分类']) acc['未分类'] = [];
                acc['未分类'].push(outfit);
              }
              return acc;
            }, {})).map(([tag, outfits]: [string, any[]]) => (
              <div key={tag} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    {tag} · {outfits.length}套
                  </h3>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {outfits.map((outfit: any) => (
                    <div
                      key={outfit.id}
                      onClick={() => handleEditOutfit(outfit)}
                      className="aspect-[9/16] bg-slate-50 rounded-lg overflow-hidden cursor-pointer relative group shadow-sm border border-slate-50"
                    >
                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOutfit(outfit.id);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                      >
                        <Trash2 size={12} />
                      </button>
                      
                      {/* 试穿效果图 */}
                      {outfit.tryonImage ? (
                        <ImageRenderer
                          src={outfit.tryonImage}
                          alt={outfit.name || '搭配'}
                          aspectRatio="9/16"
                          className="w-full h-full mix-blend-multiply transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <BookmarkPlus size={24} className="mb-1 opacity-50" />
                          <span className="text-xs">{outfit.name || '搭配'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          
          {/* 编辑搭配弹窗 */}
          {editingOutfit && (
            <div className="fixed inset-0 z-[200] flex items-start justify-center">
              {/* 遮罩背景 */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
                setEditingOutfit(null);
                setCustomName('');
                setCustomTags([]);
              }} />
              {/* 弹窗内容 - 严格限制在上下菜单之间 */}
              <div className="relative w-full max-w-[calc(393px-32px)] mx-4 mt-[72px] mb-[88px] max-h-[calc(852px-160px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800">编辑搭配</h3>
                  <button
                    onClick={() => {
                      setEditingOutfit(null);
                      setCustomName('');
                      setCustomTags([]);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">搭配名称</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="给搭配起个名字..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">标签</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {customTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => removeTag(tag)}
                          className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm hover:bg-indigo-200"
                        >
                          {tag} <span className="ml-1">×</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') addTag();
                        }}
                        placeholder="添加标签..."
                        className="flex-1 px-3 py-1 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                      />
                      <button
                        onClick={addTag}
                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                  
                  {/* 显示搭配详情 */}
                  {editingOutfit.tryonImage && (
                    <div className="aspect-[9/16] rounded-xl overflow-hidden bg-slate-100">
                      <ImageRenderer
                        src={editingOutfit.tryonImage}
                        alt="试穿效果"
                        aspectRatio="9/16"
                        className="w-full h-full"
                      />
                    </div>
                  )}
                  
                  {/* 单品列表 */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {editingOutfit.topId && getById(editingOutfit.topId) && (
                      <div className="flex-shrink-0">
                        <div className="aspect-[9/16] w-16 rounded-lg overflow-hidden bg-slate-50">
                          <ImageRenderer
                            src={getById(editingOutfit.topId)?.imageFront}
                            alt="上装"
                            aspectRatio="9/16"
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-xs text-slate-500 text-center block">上装</span>
                      </div>
                    )}
                    {editingOutfit.bottomId && getById(editingOutfit.bottomId) && (
                      <div className="flex-shrink-0">
                        <div className="aspect-[9/16] w-16 rounded-lg overflow-hidden bg-slate-50">
                          <ImageRenderer
                            src={getById(editingOutfit.bottomId)?.imageFront}
                            alt="下装"
                            aspectRatio="9/16"
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-xs text-slate-500 text-center block">下装</span>
                      </div>
                    )}
                    {editingOutfit.shoesId && getById(editingOutfit.shoesId) && (
                      <div className="flex-shrink-0">
                        <div className="aspect-[9/16] w-16 rounded-lg overflow-hidden bg-slate-50">
                          <ImageRenderer
                            src={getById(editingOutfit.shoesId)?.imageFront}
                            alt="鞋履"
                            aspectRatio="9/16"
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-xs text-slate-500 text-center block">鞋履</span>
                      </div>
                    )}
                  </div>
                  
                  {editingOutfit.reasoning && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-600">{editingOutfit.reasoning}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveEditedOutfit}
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                      保存更改
                    </button>
                    <button
                      onClick={() => {
                        setEditingOutfit(null);
                        setCustomName('');
                        setCustomTags([]);
                      }}
                      className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-300"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Stylist;
