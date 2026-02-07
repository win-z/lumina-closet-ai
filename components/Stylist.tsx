/**
 * ==================== Stylist Component (Refactored) ====================
 * 使用 hooks 管理数据
 */

import React, { useState } from 'react';
import { useWardrobe } from '../src/hooks/useWardrobe';
import { useProfile } from '../src/hooks/useProfile';
import { useDiary } from '../src/hooks/useDiary';
import { useApp } from '../src/context/AppContext';
import { aiApi, outfitsApi } from '../services/api';
import ImageRenderer from './ImageRenderer';
import { Sparkles, CloudSun, Calendar, RefreshCw, BookmarkPlus, Trash2, Edit } from 'lucide-react';

const Stylist: React.FC = () => {
  const { items: wardrobe, getById } = useWardrobe();
  const { profile } = useProfile();
  const { add: addToDiary } = useDiary();
  const { user, loadUserData } = useApp();

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

  // 切换到已保存标签时加载数据
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
      alert("请先在衣橱中添加一些衣物！");
      return;
    }
    setLoading(true);
    setSuggestion(null);
    try {
      const result = await aiApi.outfit(weather, occasion);
      setSuggestion(result);
    } catch (e) {
      console.error(e);
      alert("生成搭配失败，请检查网络或Key。");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToOutfit = async () => {
    if (!suggestion) return;

    try {
      console.log('开始保存搭配...');
      await outfitsApi.save({
        name: customName || undefined,
        tags: customTags,
        weather,
        occasion,
        topId: suggestion.topId,
        bottomId: suggestion.bottomId,
        shoesId: suggestion.shoesId,
        reasoning: suggestion.reasoning,
        tryonImage: suggestion.tryOnImage || undefined,
      });
      console.log('保存成功');
      alert("已保存到已保存搭配！");
      // 清空并刷新
      setSuggestion(null);
      setCustomName('');
      setCustomTags([]);
      setActiveTab('saved');
      // 强制刷新已保存搭配列表
      setTimeout(() => {
        console.log('刷新已保存搭配列表');
        loadSavedOutfits();
      }, 200);
    } catch (e: any) {
      console.error("保存失败", e);
      alert("保存失败: " + (e?.message || '未知错误'));
    }
  };

  const handleEditOutfit = (entry: any) => {
    setEditingOutfit(entry);
    setCustomName(entry.name || '');
    setCustomTags(entry.tags || []);
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
      alert("搭配已更新！");
      setEditingOutfit(null);
      setCustomName('');
      setCustomTags([]);
      loadSavedOutfits();
    } catch (e) {
      console.error("更新失败", e);
      alert("更新失败");
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
          </div>

          {/* Suggestion Display */}
          {suggestion && (
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">推荐搭配</h3>
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

              {/* Outfit Items */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {suggestion.topId && (
                  <div className="flex-shrink-0">
                    <div className="w-24 h-32 rounded-lg overflow-hidden bg-slate-50 mb-1">
                      <ImageRenderer
                        src={getItem(suggestion.topId)?.imageFront}
                        alt="上装"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-slate-500">上装</span>
                  </div>
                )}
                {suggestion.bottomId && (
                  <div className="flex-shrink-0">
                    <div className="w-24 h-32 rounded-lg overflow-hidden bg-slate-50 mb-1">
                      <ImageRenderer
                        src={getItem(suggestion.bottomId)?.imageFront}
                        alt="下装"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-slate-500">下装</span>
                  </div>
                )}
                {suggestion.shoesId && (
                  <div className="flex-shrink-0">
                    <div className="w-24 h-32 rounded-lg overflow-hidden bg-slate-50 mb-1">
                      <ImageRenderer
                        src={getItem(suggestion.shoesId)?.imageFront}
                        alt="鞋履"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-slate-500">鞋履</span>
                  </div>
                )}
              </div>

              {/* Try-On Image */}
              {suggestion.tryOnImage && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">试穿效果</p>
                  <div className="w-full rounded-xl overflow-hidden bg-slate-100">
                    <ImageRenderer
                      src={suggestion.tryOnImage}
                      alt="试穿效果"
                      className="w-full h-auto"
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
        <div className="space-y-4">
          {savedOutfits.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <BookmarkPlus size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">还没有保存的搭配</p>
              <p className="text-sm text-slate-400">切换到"生成搭配"标签，让AI为你推荐搭配</p>
            </div>
          ) : (
            savedOutfits.map((entry: any) => (
              <div key={entry.id} className="bg-white rounded-2xl shadow-lg p-4">
                {editingOutfit?.id === entry.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">搭配名称</label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">标签</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {customTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => removeTag(tag)}
                            className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm"
                          >
                            {tag}
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
                          className="flex-1 px-3 py-1 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                        />
                        <button
                          onClick={addTag}
                          className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEditedOutfit}
                        className="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                      >
                        保存更改
                      </button>
                      <button
                        onClick={() => {
                          setEditingOutfit(null);
                          setCustomName('');
                          setCustomTags([]);
                        }}
                        className="flex-1 py-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-800">{entry.name || '未命名搭配'}</h4>
                        <p className="text-xs text-slate-500">{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ''}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditOutfit(entry)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {entry.tags.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Weather & Occasion */}
                    <div className="flex gap-2 mb-2 text-xs text-slate-500">
                      {entry.weather && <span>🌤️ {entry.weather}</span>}
                      {entry.occasion && <span>📅 {entry.occasion}</span>}
                    </div>

                    {/* 试穿效果图 */}
                    {entry.tryonImage && (
                      <div className="w-full rounded-xl overflow-hidden bg-slate-100 mb-3">
                        <ImageRenderer
                          src={entry.tryonImage}
                          alt="试穿效果"
                          className="w-full h-auto"
                        />
                      </div>
                    )}

                    {/* Clothing Items */}
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {/* Top */}
                      {entry.topId && (() => {
                        const item = getById(entry.topId);
                        if (!item) return null;
                        return (
                          <div key={entry.topId} className="flex-shrink-0">
                            <div className="w-20 h-28 rounded-lg overflow-hidden bg-slate-50 mb-1">
                              <ImageRenderer
                                src={item.imageFront}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs text-slate-500 truncate w-20 text-center block">上装</span>
                          </div>
                        );
                      })()}

                      {/* Bottom */}
                      {entry.bottomId && (() => {
                        const item = getById(entry.bottomId);
                        if (!item) return null;
                        return (
                          <div key={entry.bottomId} className="flex-shrink-0">
                            <div className="w-20 h-28 rounded-lg overflow-hidden bg-slate-50 mb-1">
                              <ImageRenderer
                                src={item.imageFront}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs text-slate-500 truncate w-20 text-center block">下装</span>
                          </div>
                        );
                      })()}

                      {/* Shoes */}
                      {entry.shoesId && (() => {
                        const item = getById(entry.shoesId);
                        if (!item) return null;
                        return (
                          <div key={entry.shoesId} className="flex-shrink-0">
                            <div className="w-20 h-28 rounded-lg overflow-hidden bg-slate-50 mb-1">
                              <ImageRenderer
                                src={item.imageFront}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs text-slate-500 truncate w-20 text-center block">鞋履</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Reasoning */}
                    {entry.reasoning && (
                      <div className="bg-slate-50 rounded-xl p-3 mt-2">
                        <p className="text-xs text-slate-600">{entry.reasoning}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Stylist;
