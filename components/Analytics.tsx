/**
 * ==================== Analytics Component (Enhanced) ====================
 * 增强版分析组件 - 支持多维度统计和保存分析结果
 */

import React, { useEffect, useState } from 'react';
import { useWardrobe } from '../src/hooks/useWardrobe';
import { useToast } from '../src/context/ToastContext';
import { aiApi, analyticsApi, diaryApi } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { BrainCircuit, RefreshCw, Calendar, TrendingUp, DollarSign, Palette, Tag, Shirt, BookHeart } from 'lucide-react';
import ImageRenderer from './ImageRenderer';

interface AnalysisData {
  id: string;
  categoryStats: Record<string, number>;
  colorStats: Record<string, number>;
  brandStats: Record<string, number>;
  priceStats: {
    totalValue: number;
    averagePrice: number;
    maxPrice: number;
    minPrice: number;
  };
  wearStats: any[];
  aiAnalysis?: string;
  createdAt: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#84cc16'];

const Analytics: React.FC = () => {
  const { items: wardrobe } = useWardrobe();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [brandStats, setBrandStats] = useState<any>(null);
  const [priceStats, setPriceStats] = useState<any>(null);
  const [wearStats, setWearStats] = useState<any>(null);
  const [diaryStats, setDiaryStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'brand' | 'price' | 'wear' | 'diary'>('overview');

  // 加载保存的分析结果
  const loadSavedAnalysis = async () => {
    try {
      const data = await analyticsApi.getLatest();
      if (data) {
        setAnalysis(data);
      }
    } catch (err) {
      console.error('分析失败:', err);
      showError('分析失败，请重试');
    }
  };

  // 加载品牌统计
  const loadBrandStats = async () => {
    try {
      const data = await analyticsApi.getBrand();
      setBrandStats(data);
    } catch (err) {
      console.error('加载品牌统计失败:', err);
    }
  };

  // 加载价格统计
  const loadPriceStats = async () => {
    try {
      const data = await analyticsApi.getPrice();
      setPriceStats(data);
    } catch (err) {
      console.error('加载价格统计失败:', err);
    }
  };

  // 加载穿着统计
  const loadWearStats = async () => {
    try {
      const data = await analyticsApi.getWearFrequency();
      setWearStats(data);
    } catch (err) {
      console.error('加载穿着统计失败:', err);
    }
  };

  // 加载日记统计
  const loadDiaryStats = async () => {
    try {
      const now = new Date();
      const stats = await diaryApi.getMonthlyStats(now.getFullYear(), now.getMonth() + 1);
      
      // 获取今年的所有日记
      const yearStart = `${now.getFullYear()}-01-01`;
      const yearEnd = `${now.getFullYear()}-12-31`;
      const allDiaries = await diaryApi.getAll(1, 1000, yearStart, yearEnd);
      
      setDiaryStats({
        ...stats,
        totalThisYear: allDiaries?.length || 0,
      });
    } catch (err) {
      console.error('加载日记统计失败:', err);
    }
  };

  // 执行完整分析
  const performAnalysis = async () => {
    setLoading(true);
    try {
      const result = await aiApi.analyze();
      showSuccess('分析完成');
      await loadSavedAnalysis();
    } catch (err) {
      showError('分析失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedAnalysis();
    loadBrandStats();
    loadPriceStats();
    loadWearStats();
    loadDiaryStats();
  }, []);

  // 品类分布数据
  const categoryData = Object.entries(analysis?.categoryStats || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // 颜色分布数据（前10）
  const colorData = Object.entries(analysis?.colorStats || {} as Record<string, number>)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="p-4 pb-28 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold font-serif text-slate-800">衣橱分析</h2>
          <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-xs font-bold uppercase">Stats</span>
        </div>
        <button
          onClick={performAnalysis}
          disabled={loading || wardrobe.length === 0}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          重新分析
        </button>
      </div>

      {/* 上次分析时间 */}
      {analysis?.createdAt && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar size={14} />
          <span>上次分析: {formatDate(analysis.createdAt)}</span>
        </div>
      )}

      {wardrobe.length === 0 ? (
        <div className="text-center mt-10 p-10 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <BrainCircuit size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">添加衣物后即可查看分析报告。</p>
        </div>
      ) : (
        <>
          {/* Tab 切换 */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'overview', label: '总览', icon: TrendingUp },
              { key: 'brand', label: '品牌', icon: Tag },
              { key: 'price', label: '价格', icon: DollarSign },
              { key: 'wear', label: '穿着', icon: Shirt },
              { key: 'diary', label: '日记', icon: BookHeart },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* 总览 Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 基础统计 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-2xl font-bold text-indigo-500">{wardrobe.length}</div>
                  <div className="text-xs text-slate-500 mt-1">总单品数</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-2xl font-bold text-purple-500">
                    {Object.keys(analysis?.categoryStats || {}).length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">品类数</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-2xl font-bold text-emerald-500">
                    {Object.keys(analysis?.colorStats || {}).length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">颜色数</div>
                </div>
              </div>

              {/* 品类分布 */}
              {categoryData.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-4 text-center">
                    品类构成
                  </h3>
                  <div className="w-full relative" style={{ height: '250px', minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {categoryData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-slate-600">{entry.name}</span>
                        <span className="text-slate-400">({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 颜色分布 */}
              {colorData.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Palette size={16} />
                    颜色分布（Top 10）
                  </h3>
                  <div className="w-full relative" style={{ height: '200px', minHeight: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={colorData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={60} style={{ fontSize: '12px' }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* AI 分析 */}
              {analysis?.aiAnalysis && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BrainCircuit size={16} />
                    AI 分析报告
                  </h3>
                  <div className="prose prose-sm max-w-none text-slate-600">
                    {analysis.aiAnalysis.split('\n').map((line, idx) => (
                      <p key={idx} className="mb-2">{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 品牌 Tab */}
          {activeTab === 'brand' && brandStats && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">品牌偏好</h3>
                <p className="text-sm text-slate-500 mt-1">
                  共 {brandStats.totalBrands} 个品牌
                </p>
              </div>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {brandStats.brands?.map((brand: any, index: number) => (
                  <div key={brand.name} className="p-4 flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-400 w-6">{index + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{brand.name}</p>
                      <p className="text-xs text-slate-500">
                        {brand.count} 件 · ¥{brand.totalValue.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {brand.items.slice(0, 3).map((item: any) => (
                        <div key={item.id} className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50">
                          <ImageRenderer
                            src={item.imageFront}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 价格 Tab */}
          {activeTab === 'price' && priceStats && (
            <div className="space-y-4">
              {/* 价格概览 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-xl font-bold text-emerald-500">
                    ¥{priceStats.totalValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">总价值</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-xl font-bold text-blue-500">
                    ¥{priceStats.averagePrice.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">平均单价</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-xl font-bold text-rose-500">
                    ¥{priceStats.maxPrice.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">最贵单品</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-xl font-bold text-amber-500">
                    {priceStats.itemsWithPrice}/{priceStats.totalItems}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">已标价/总数</div>
                </div>
              </div>

              {/* 价格区间分布 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-4">
                  价格区间分布
                </h3>
                <div className="space-y-3">
                  {Object.entries(priceStats.priceRanges || {}).map(([range, count]) => (
                    <div key={range} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-20">{range}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                          style={{ 
                            width: `${priceStats.itemsWithPrice > 0 ? (count as number) / priceStats.itemsWithPrice * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-500 w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 穿着 Tab */}
          {activeTab === 'wear' && wearStats && (
            <div className="space-y-4">
              {/* 穿着概览 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-2xl font-bold text-emerald-500">{wearStats.totalWorn}</div>
                  <div className="text-xs text-slate-500 mt-1">已穿着单品</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-2xl font-bold text-rose-500">{wearStats.totalUnworn}</div>
                  <div className="text-xs text-slate-500 mt-1">未穿着单品</div>
                </div>
              </div>

              {/* 最常穿着 */}
              {wearStats.mostWorn?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">最常穿着</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {wearStats.mostWorn.slice(0, 5).map((stat: any, index: number) => (
                      <div key={stat.clothingId} className="p-4 flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-400 w-6">{index + 1}</span>
                        {stat.clothingItem && (
                          <div className="aspect-[9/16] w-12 rounded-lg overflow-hidden bg-slate-50">
                            <ImageRenderer
                              src={stat.clothingItem.imageFront}
                              alt={stat.clothingItem.name}
                              aspectRatio="9/16"
                              className="w-full h-full"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">
                            {stat.clothingItem?.name || '未知单品'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {stat.clothingItem?.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-500">{stat.wearCount}</p>
                          <p className="text-xs text-slate-500">次穿着</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 未穿着单品 */}
              {wearStats.unwornItems?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">未穿着单品（考虑断舍离）</h3>
                  </div>
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {wearStats.unwornItems.slice(0, 10).map((item: any) => (
                      <div key={item.id} className="flex-shrink-0">
                        <div className="aspect-[9/16] w-14 rounded-lg overflow-hidden bg-slate-50">
                          <ImageRenderer
                            src={item.imageFront}
                            alt={item.name}
                            aspectRatio="9/16"
                            className="w-full h-full"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 truncate w-14 mt-1 text-center">
                          {item.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 日记 Tab */}
          {activeTab === 'diary' && diaryStats && (
            <div className="space-y-4">
              {/* 日记统计概览 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-2xl font-bold text-rose-500">{diaryStats.totalEntries}</div>
                  <div className="text-xs text-slate-500 mt-1">本月记录</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-2xl font-bold text-indigo-500">{diaryStats.totalThisYear || 0}</div>
                  <div className="text-xs text-slate-500 mt-1">今年记录</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-2xl font-bold text-purple-500">{diaryStats.uniqueOutfits}</div>
                  <div className="text-xs text-slate-500 mt-1">不同搭配</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-2xl font-bold text-amber-500">{diaryStats.avgMood || '-'}</div>
                  <div className="text-xs text-slate-500 mt-1">主要心情</div>
                </div>
              </div>

              {/* 日记统计说明 */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-100">
                <h3 className="font-bold text-rose-800 mb-3 flex items-center gap-2">
                  <BookHeart size={20} />
                  穿搭日记统计
                </h3>
                <div className="space-y-2 text-sm text-rose-700">
                  <p>
                    <span className="font-medium">记录习惯：</span>
                    本月已记录 {diaryStats.totalEntries} 天穿搭
                    {diaryStats.totalEntries > 20 ? '，非常棒的习惯！' : 
                     diaryStats.totalEntries > 10 ? '，继续保持！' : '，还有提升空间~'}
                  </p>
                  <p>
                    <span className="font-medium">搭配多样性：</span>
                    使用了 {diaryStats.uniqueOutfits} 种不同搭配
                    {diaryStats.uniqueOutfits > 15 ? '，你的穿搭很有创意！' : 
                     diaryStats.uniqueOutfits > 8 ? '，搭配很丰富！' : ''}
                  </p>
                  {diaryStats.avgMood && (
                    <p>
                      <span className="font-medium">本月心情：</span>
                      主要心情是"{diaryStats.avgMood}"
                    </p>
                  )}
                </div>
              </div>

              {/* 提示信息 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <h3 className="font-semibold text-slate-800 mb-2">小贴士</h3>
                <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                  <li>坚持记录穿搭可以帮你了解自己的穿衣习惯</li>
                  <li>通过日记回顾，可以发现哪些搭配最适合自己</li>
                  <li>心情和天气的记录有助于分析穿搭与情绪的关系</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
