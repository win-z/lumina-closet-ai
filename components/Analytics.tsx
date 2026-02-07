/**
 * ==================== Analytics Component (Refactored) ====================
 * 使用 useWardrobe hook
 */

import React, { useEffect, useState } from 'react';
import { useWardrobe } from '../src/hooks/useWardrobe';
import { aiApi } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BrainCircuit } from 'lucide-react';

const Analytics: React.FC = () => {
  const { items: wardrobe } = useWardrobe();
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wardrobe.length > 0) {
      setLoading(true);
      aiApi.analyze()
        .then((result: any) => setAnalysis(result.analysis))
        .catch(err => console.error("Analysis failed", err))
        .finally(() => setLoading(false));
    }
  }, [wardrobe.length]);

  // Calculate category distribution
  const categoryData = Object.values(wardrobe.reduce((acc: any, item: any) => {
    const cat = item.category || '未分类';
    acc[cat] = acc[cat] || { name: cat, value: 0 };
    acc[cat].value += 1;
    return acc;
  }, {}));

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  return (
    <div className="p-4 pb-28 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold font-serif text-slate-800">衣橱分析</h2>
        <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-xs font-bold uppercase">Stats</span>
      </div>
      
      {wardrobe.length === 0 ? (
        <div className="text-center mt-10 p-10 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <BrainCircuit size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">添加衣物后即可查看分析报告。</p>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
              <div className="text-2xl font-bold text-indigo-500">{wardrobe.length}</div>
              <div className="text-xs text-slate-500 mt-1">总单品数</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
              <div className="text-2xl font-bold text-purple-500">{categoryData.length}</div>
              <div className="text-xs text-slate-500 mt-1">品类数</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
              <div className="text-2xl font-bold text-rose-500">
                {new Set(wardrobe.map((i: any) => i.color)).size}
              </div>
              <div className="text-xs text-slate-500 mt-1">颜色数</div>
            </div>
          </div>

          {/* Category Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-4 text-center">品类构成</h3>
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
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {categoryData.map((entry: any, index: number) => (
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

          {/* AI Analysis */}
          {loading ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
              <div className="animate-pulse text-slate-400">AI分析中...</div>
            </div>
          ) : analysis ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-4">AI 分析报告</h3>
              <div className="prose prose-sm max-w-none text-slate-600">
                {analysis.split('\n').map((line, idx) => (
                  <p key={idx} className="mb-2">{line}</p>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default Analytics;
