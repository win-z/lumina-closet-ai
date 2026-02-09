/**
 * ==================== ClothingCalendar Component ====================
 * 穿着记录/穿搭日历 - 记录和查看每天的穿着
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useWardrobe } from '../src/hooks/useWardrobe';
import { clothingRecordApi } from '../services/api';
import ImageRenderer from './ImageRenderer';
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Check, BarChart3 } from 'lucide-react';
import { ClothingCategory } from '../types';

interface ClothingRecord {
  id: string;
  date: string;
  clothingIds: string[];
  notes?: string;
  clothingItems?: any[];
}

const ClothingCalendar: React.FC = () => {
  const { items: wardrobe, getById } = useWardrobe();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState<ClothingRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedClothing, setSelectedClothing] = useState<string[]>([]);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [stats, setStats] = useState<{ clothingId: string; wearCount: number; clothingItem?: any }[]>([]);
  const [showStats, setShowStats] = useState(false);

  // 获取当前月份的开始和结束日期
  const getMonthRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    return { startDate, endDate };
  };

  // 加载穿着记录
  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getMonthRange();
      const data = await clothingRecordApi.getAll(startDate, endDate);
      setRecords(data || []);
    } catch (err) {
      console.error('加载穿着记录失败:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  // 加载统计
  const loadStats = useCallback(async () => {
    try {
      const data = await clothingRecordApi.getStats();
      setStats(data || []);
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  }, []);

  useEffect(() => {
    loadRecords();
    loadStats();
  }, [loadRecords, loadStats]);

  // 获取某一天的记录
  const getRecordForDate = (dateStr: string) => {
    return records.find(r => r.date === dateStr);
  };

  // 生成日历数据
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // 填充月初空白
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // 切换月份
  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  // 打开记录弹窗
  const openRecordModal = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existingRecord = getRecordForDate(dateStr);
    if (existingRecord) {
      setSelectedClothing(existingRecord.clothingIds);
    } else {
      setSelectedClothing([]);
    }
    setShowRecordModal(true);
  };

  // 保存记录
  const saveRecord = async () => {
    if (!selectedDate || selectedClothing.length === 0) return;

    try {
      const existingRecord = getRecordForDate(selectedDate);
      if (existingRecord) {
        await clothingRecordApi.update(existingRecord.id, { clothingIds: selectedClothing });
      } else {
        await clothingRecordApi.create({ date: selectedDate, clothingIds: selectedClothing });
      }
      await loadRecords();
      await loadStats();
      setShowRecordModal(false);
    } catch (err) {
      console.error('保存记录失败:', err);
      alert('保存失败，请重试');
    }
  };

  // 切换衣物选择
  const toggleClothing = (id: string) => {
    setSelectedClothing(prev => 
      prev.includes(id) 
        ? prev.filter(cid => cid !== id)
        : [...prev, id]
    );
  };

  // 按类别分组衣物
  const clothingByCategory = wardrobe.reduce<Record<string, typeof wardrobe>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  return (
    <div className="p-4 pb-28 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold font-serif text-slate-800">穿着记录</h2>
          <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-xs font-bold uppercase">Calendar</span>
        </div>
        <button 
          onClick={() => setShowStats(!showStats)}
          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
        >
          <BarChart3 size={20} />
        </button>
      </div>

      {/* 统计面板 */}
      {showStats && (
        <div className="bg-white rounded-2xl shadow-lg p-4 space-y-4">
          <h3 className="font-semibold text-slate-800">穿着统计</h3>
          {stats.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stats.slice(0, 10).map((stat, idx) => (
                <div key={stat.clothingId} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-500 w-6">{idx + 1}</span>
                  {stat.clothingItem && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      <ImageRenderer
                        src={stat.clothingItem.imageFront}
                        alt={stat.clothingItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {stat.clothingItem?.name || '未知单品'}
                    </p>
                    <p className="text-xs text-slate-500">
                      穿着 {stat.wearCount} 次
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">暂无穿着记录</p>
          )}
        </div>
      )}

      {/* 日历头部 */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => changeMonth(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <span className="text-lg font-semibold text-slate-800">
          {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
        </span>
        <button 
          onClick={() => changeMonth(1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} className="text-slate-600" />
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* 日历日期 */}
      <div className="grid grid-cols-7 gap-1">
        {generateCalendarDays().map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = date.toISOString().split('T')[0];
          const record = getRecordForDate(dateStr);
          const isToday = dateStr === new Date().toISOString().split('T')[0];

          return (
            <button
              key={dateStr}
              onClick={() => openRecordModal(dateStr)}
              className={`aspect-square rounded-lg p-1 relative transition-all ${
                isToday 
                  ? 'bg-emerald-100 border-2 border-emerald-500' 
                  : 'bg-white border border-slate-100 hover:border-emerald-300'
              }`}
            >
              <span className={`text-sm font-medium ${isToday ? 'text-emerald-700' : 'text-slate-700'}`}>
                {date.getDate()}
              </span>
              
              {/* 显示记录预览 */}
              {record && record.clothingItems && record.clothingItems.length > 0 && (
                <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 justify-center">
                  {record.clothingItems.slice(0, 3).map((item, idx) => (
                    <div 
                      key={idx} 
                      className="w-4 h-4 rounded-sm overflow-hidden bg-slate-100"
                    >
                      <ImageRenderer
                        src={item.imageFront}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {record.clothingItems.length > 3 && (
                    <span className="text-[8px] text-slate-500">+</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 今日快捷记录按钮 */}
      <button
        onClick={() => openRecordModal(new Date().toISOString().split('T')[0])}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        记录今日穿着
      </button>

      {/* 记录弹窗 */}
      {showRecordModal && selectedDate && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center">
          {/* 遮罩背景 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRecordModal(false)} />
          {/* 弹窗内容 - 严格限制在上下菜单之间 */}
          <div className="relative w-full max-w-[calc(393px-32px)] mx-4 mt-[72px] mb-[88px] max-h-[calc(852px-160px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">
                {selectedDate === new Date().toISOString().split('T')[0] ? '今日' : selectedDate} 穿着记录
              </h3>
              <button
                onClick={() => setShowRecordModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {Object.entries(clothingByCategory).map(([category, items]: [string, typeof wardrobe]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-600">{category}</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {items.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => toggleClothing(item.id)}
                        className={`flex-shrink-0 relative ${
                          selectedClothing.includes(item.id) 
                            ? 'ring-2 ring-emerald-500 rounded-lg' 
                            : ''
                        }`}
                      >
                        <div className="aspect-[9/16] w-16 rounded-lg overflow-hidden bg-slate-50">
                          <ImageRenderer
                            src={item.imageFront}
                            alt={item.name}
                            aspectRatio="9/16"
                            className="w-full h-full"
                          />
                        </div>
                        {selectedClothing.includes(item.id) && (
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Check size={16} className="text-emerald-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {wardrobe.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p>衣橱为空</p>
                  <p className="text-sm mt-1">先去添加一些衣物吧</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={saveRecord}
                  disabled={selectedClothing.length === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  保存记录
                </button>
                <button
                  onClick={() => setShowRecordModal(false)}
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
  );
};

export default ClothingCalendar;
