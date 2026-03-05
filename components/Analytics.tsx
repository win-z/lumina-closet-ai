/**
 * ==================== Analytics Component (Enhanced) ====================
 * 增强版分析组件 - 支持多维度统计和保存分析结果
 */

import React, { useEffect, useState } from 'react';
import { useWardrobe } from '../src/hooks/useWardrobe';
import { useToast } from '../src/context/ToastContext';
import { aiApi, analyticsApi, diaryApi } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { BrainCircuit, RefreshCw, Calendar, TrendingUp, DollarSign, Palette, Tag, Shirt, BookHeart, Lightbulb, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
import ImageRenderer from './ImageRenderer';

// 简单的 Markdown 渲染组件，处理加粗和对列表进行美化
const MarkdownRenderer: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
  const lines = content.split('\n');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // 处理标题行 ## / ###（去掉 # 符号，渲染为加粗文字）
        if (trimmed.startsWith('### ')) {
          const headingText = trimmed.replace(/^###\s*/, '');
          return <p key={i} className="font-bold text-slate-800 mt-2">{headingText}</p>;
        }
        if (trimmed.startsWith('## ')) {
          const headingText = trimmed.replace(/^##\s*/, '');
          return <p key={i} className="font-extrabold text-slate-900 text-base mt-2">{headingText}</p>;
        }
        if (trimmed.startsWith('# ')) {
          const headingText = trimmed.replace(/^#\s*/, '');
          return <p key={i} className="font-extrabold text-slate-900 text-lg mt-2">{headingText}</p>;
        }

        // 处理列表项
        const isListItem = trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const cleanLine = isListItem ? trimmed.substring(2) : line;

        // 处理加粗 **text**
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        const renderedLine = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={j} className="font-extrabold text-slate-900 mx-0.5">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{part}</span>;
        });

        if (isListItem) {
          return (
            <div key={i} className="flex gap-2 items-start pl-1">
              <span className="text-slate-400 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-40" />
              <p className="flex-1">{renderedLine}</p>
            </div>
          );
        }

        return <p key={i} className={trimmed === '' ? 'h-2' : ''}>{renderedLine}</p>;
      })}
    </div>
  );
};

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
  const [aiLoading, setAiLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [brandStats, setBrandStats] = useState<any>(null);
  const [priceStats, setPriceStats] = useState<any>(null);
  const [wearStats, setWearStats] = useState<any>(null);
  const [diaryStats, setDiaryStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'brand' | 'price' | 'wear' | 'diary'>('overview');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // 优先读取带缓存的 summary，失败则降级到 latest
  const loadSummary = async () => {
    try {
      const data = await analyticsApi.getSummary() as any;
      if (data) {
        setIsCached(!!data._cached);
        setAnalysis(prev => ({
          id: '',
          categoryStats: data.categoryStats || {},
          colorStats: data.colorStats || {},
          brandStats: data.brandStats || {},
          priceStats: { totalValue: data.totalValue || 0, averagePrice: 0, maxPrice: 0, minPrice: 0 },
          wearStats: [],
          aiAnalysis: data.aiAnalysis,
          createdAt: data._cachedAt || new Date().toISOString(),
        }));
      }
    } catch {
      try {
        const data = await analyticsApi.getLatest();
        if (data) setAnalysis(data);
      } catch {
        console.error('分析数据加载失败');
      }
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

  // 刷新统计（快速，调用缓存接口）
  const refreshStats = async () => {
    setLoading(true);
    try {
      const data = await analyticsApi.refresh() as any;
      setIsCached(false);
      setAnalysis(prev => ({
        id: '',
        categoryStats: data.categoryStats || {},
        colorStats: data.colorStats || {},
        brandStats: {},
        priceStats: { totalValue: data.totalValue || 0, averagePrice: 0, maxPrice: 0, minPrice: 0 },
        wearStats: [],
        aiAnalysis: prev?.aiAnalysis,
        createdAt: new Date().toISOString(),
      }));
      showSuccess('统计已刷新');
    } catch {
      showError('刷新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // AI 深度分析（较慢）
  const performAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const result = await aiApi.analyze();
      showSuccess('AI 分析完成');

      // 直接显示结果
      if (result?.analysis) {
        setAnalysis(prev => prev ? { ...prev, aiAnalysis: result.analysis } : null);
        setIsAiModalOpen(true);
      } else {
        // 降级：拉取最新记录
        const latest = await analyticsApi.getLatest();
        if (latest?.aiAnalysis) {
          setAnalysis(prev => prev ? { ...prev, aiAnalysis: latest.aiAnalysis } : null);
          setIsAiModalOpen(true);
        }
      }
    } catch {
      showError('AI 分析失败，请重试');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
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
        <div className="flex gap-2">
          <button
            onClick={refreshStats}
            disabled={loading || wardrobe.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-500 text-white rounded-lg text-sm hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            刷新
          </button>
          <button
            onClick={performAiAnalysis}
            disabled={aiLoading || wardrobe.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiLoading ? <BrainCircuit size={14} className="animate-pulse" /> : <BrainCircuit size={14} />}
            AI 分析
          </button>
        </div>
      </div>

      {/* 上次更新时间 */}
      {analysis?.createdAt && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar size={14} />
          <span>上次更新: {formatDate(analysis.createdAt)}</span>
          {isCached && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">缓存</span>}
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
                className={`flex items-center gap-1 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab.key
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
              {/* AI 分析入口 */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2">
                    <BrainCircuit size={24} className="text-indigo-200" />
                    <h3 className="text-lg font-bold">
                      {analysis?.aiAnalysis && !analysis.aiAnalysis.startsWith('{') ? '深度报告已就绪' : '解锁您的智能衣橱报告'}
                    </h3>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {analysis?.aiAnalysis && !analysis.aiAnalysis.startsWith('{')
                      ? 'AI 已根据您的衣橱数据生成了专业的风格建议与健康度报告。'
                      : '让 AI 深度分析您的穿搭风格、色系分布，并为您提供专业的购买与搭配建议。'}
                  </p>
                  <div className="flex gap-3 mt-2">
                    {analysis?.aiAnalysis && !analysis.aiAnalysis.startsWith('{') && (
                      <button
                        onClick={() => setIsAiModalOpen(true)}
                        className="px-4 py-2 bg-indigo-400/30 backdrop-blur-md border border-white/20 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-white/20 transition-all"
                      >
                        查看深度报告
                      </button>
                    )}
                    <button
                      onClick={performAiAnalysis}
                      disabled={aiLoading || wardrobe.length === 0}
                      className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform disabled:opacity-50"
                    >
                      {aiLoading ? '生成中...' : (analysis?.aiAnalysis && !analysis.aiAnalysis.startsWith('{') ? '更新分析' : '立即开启')}
                    </button>
                  </div>
                </div>
                {/* 装饰性元素 */}
                <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              </div>

              {/* 基础统计 */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-xl sm:text-2xl font-bold text-indigo-500">{wardrobe.length}</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 mt-1">总单品数</div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-500">
                    {Object.keys(analysis?.categoryStats || {}).length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 mt-1">品类数</div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-500">
                    {Object.keys(analysis?.colorStats || {}).length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 mt-1">颜色数</div>
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
                    ¥{(priceStats.totalValue ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">总价值</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-xl font-bold text-blue-500">
                    ¥{(priceStats.averagePrice ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">平均单价</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-xl font-bold text-rose-500">
                    ¥{(priceStats.maxPrice ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">最贵单品</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                  <div className="text-xl font-bold text-amber-500">
                    {priceStats.itemsWithPrice ?? 0}/{priceStats.totalItems ?? 0}
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
                            width: `${(priceStats.itemsWithPrice ?? 0) > 0 ? ((count as number) ?? 0) / priceStats.itemsWithPrice * 100 : 0}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-500 w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 性价比排行榜 */}
              {(() => {
                // 构建 clothingId → wearCount 映射
                const wearMap: Record<string, number> = {};
                (wearStats?.mostWorn || []).forEach((w: any) => {
                  const id = w.clothingId || w.clothingItem?.id;
                  if (id) wearMap[id] = w.wearCount ?? w.count ?? 0;
                });

                // 只计算有价格 AND 有穿着记录的单品
                const cpwItems = wardrobe
                  .filter(item => Number(item.price) > 0 && wearMap[item.id] > 0)
                  .map(item => ({
                    id: item.id,
                    name: item.name,
                    price: Number(item.price),
                    wearCount: wearMap[item.id],
                    cpw: Number(item.price) / wearMap[item.id], // 每次成本
                    imageFront: item.imageFront,
                  }))
                  .sort((a, b) => a.cpw - b.cpw);

                if (cpwItems.length === 0) return null;

                const bestValue = cpwItems.slice(0, 5);
                const worstValue = [...cpwItems].reverse().slice(0, 5);

                const CpwRow = ({ item, rank, good }: { key?: string; item: typeof cpwItems[0]; rank: number; good: boolean }) => (
                  <div className="flex items-center gap-3 py-2">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${rank <= 3 ? (good ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500') : 'bg-slate-100 text-slate-400'}`}>
                      {rank}
                    </span>
                    <div className="w-8 h-10 rounded overflow-hidden bg-slate-50 flex-shrink-0">
                      {item.imageFront && <img src={item.imageFront} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">¥{item.price} ÷ {item.wearCount}次</p>
                    </div>
                    <div className={`text-right flex-shrink-0 ${good ? 'text-emerald-500' : 'text-rose-500'}`}>
                      <p className="text-base font-bold">¥{item.cpw.toFixed(1)}</p>
                      <p className="text-xs">每次</p>
                    </div>
                  </div>
                );

                return (
                  <div className="space-y-4">
                    {/* 最划算 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
                        <h3 className="font-bold text-sm text-emerald-700">💚 最划算单品</h3>
                        <p className="text-xs text-emerald-500 mt-0.5">价格 ÷ 穿着次数，越低越值</p>
                      </div>
                      <div className="px-5 divide-y divide-slate-50">
                        {bestValue.map((item, i) => <CpwRow key={item.id} item={item} rank={i + 1} good={true} />)}
                      </div>
                    </div>

                    {/* 最浪费 */}
                    {worstValue.length > 0 && (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-5 py-3 bg-gradient-to-r from-rose-50 to-orange-50 border-b border-slate-100">
                          <h3 className="font-bold text-sm text-rose-600">🔴 单次成本最高</h3>
                          <p className="text-xs text-rose-400 mt-0.5">建议多穿来摊薄成本</p>
                        </div>
                        <div className="px-5 divide-y divide-slate-50">
                          {worstValue.map((item, i) => <CpwRow key={item.id} item={item} rank={i + 1} good={false} />)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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

      {/* AI 深度分析弹窗 */}
      {isAiModalOpen && analysis?.aiAnalysis && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAiModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-slate-50 rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">AI 衣橱深度分析</h3>
                  <p className="text-xs text-slate-500">基于您的实时衣橱数据生成</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 pb-12">
              {analysis.aiAnalysis.startsWith('{') ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full mx-auto flex items-center justify-center">
                    <AlertCircle size={32} />
                  </div>
                  <p className="text-slate-600 font-medium">检测到旧版缓存数据，请重新生成报告以获得最佳体验。</p>
                  <button
                    onClick={() => {
                      setIsAiModalOpen(false);
                      performAiAnalysis();
                    }}
                    className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-100"
                  >
                    立即重新生成
                  </button>
                </div>
              ) : (
                analysis.aiAnalysis.split('###').filter(s => s.trim()).map((section, idx) => {
                  const lines = section.trim().split('\n');
                  const rawTitle = lines[0].trim();
                  // 去掉 Markdown 标题符号（#/##/###）、emoji 以及多余空格
                  const title = rawTitle.replace(/^#+\s*/, '').replace(/^💡\s*/, '').trim();
                  const content = lines.slice(1).join('\n').trim();

                  // 简单的结构化映射
                  const iconMap = [<Lightbulb />, <TrendingUp />, <Palette />, <CheckCircle2 />];
                  const colorMap = [
                    'bg-amber-50 border-amber-200 text-amber-800',
                    'bg-indigo-50 border-indigo-200 text-indigo-800',
                    'bg-emerald-50 border-emerald-200 text-emerald-800',
                    'bg-rose-50 border-rose-200 text-rose-800'
                  ];

                  return (
                    <div key={idx} className={`rounded-3xl border-2 p-6 space-y-3 ${colorMap[idx % colorMap.length]}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shadow-sm">
                          {React.cloneElement(iconMap[idx % iconMap.length] as React.ReactElement, { size: 18 })}
                        </div>
                        <h4 className="font-bold text-lg">{title}</h4>
                      </div>
                      <div className="text-sm leading-relaxed opacity-95 font-medium">
                        <MarkdownRenderer content={content} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-center shrink-0">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
