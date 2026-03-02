/**
 * ==================== Diary Component (Calendar Version) ====================
 * 日历形式的穿搭日记 - 点击日期记录每日穿搭
 * 功能：日历视图、日期标记、搭配导入、日记编辑
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useWardrobe } from '../src/hooks/useWardrobe';
import { useToast } from '../src/context/ToastContext';
import { diaryApi, outfitsApi } from '../services/api';
import ImageRenderer from './ImageRenderer';
import {
  ChevronLeft, ChevronRight, Calendar, CloudSun, Smile,
  Plus, X, BookmarkPlus, Trash2, Camera, Sparkles,
  Sun, Cloud, CloudRain, Wind, Snowflake
} from 'lucide-react';

// ==================== 类型定义 ====================
interface DiaryData {
  id?: string;
  date: string;
  weather: string;
  mood: string;
  notes: string;
  clothingIds: string[];
  photo?: string;
  outfitId?: string;
  clothingItems?: any[];
}

interface CalendarDate {
  date: string;
  hasEntry: boolean;
  hasPhoto: boolean;
  hasOutfit: boolean;
  mood?: string;
}

interface SavedOutfit {
  id: string;
  name?: string;
  tags: string[];
  weather?: string;
  occasion?: string;
  dressId?: string;
  topId?: string;
  bottomId?: string;
  shoesId?: string;
  tryonImage?: string;
  reasoning?: string;
  clothingItems?: any[];
}

// ==================== 天气选项 ====================
const WEATHER_OPTIONS = [
  { value: '晴天', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50' },
  { value: '多云', icon: Cloud, color: 'text-slate-500', bg: 'bg-slate-50' },
  { value: '阴天', icon: CloudSun, color: 'text-gray-500', bg: 'bg-gray-50' },
  { value: '小雨', icon: CloudRain, color: 'text-blue-400', bg: 'bg-blue-50' },
  { value: '大风', icon: Wind, color: 'text-teal-500', bg: 'bg-teal-50' },
  { value: '雪天', icon: Snowflake, color: 'text-cyan-400', bg: 'bg-cyan-50' },
];

// ==================== 心情选项 ====================
const MOOD_OPTIONS = [
  { value: '开心', emoji: '😊', color: 'bg-yellow-100 text-yellow-700' },
  { value: '自信', emoji: '😎', color: 'bg-purple-100 text-purple-700' },
  { value: '舒适', emoji: '😌', color: 'bg-green-100 text-green-700' },
  { value: '疲惫', emoji: '😔', color: 'bg-gray-100 text-gray-700' },
  { value: '兴奋', emoji: '🤩', color: 'bg-pink-100 text-pink-700' },
  { value: '平静', emoji: '😶', color: 'bg-blue-100 text-blue-700' },
];

const Diary: React.FC = () => {
  // ==================== State ====================
  const { items: wardrobe, getById } = useWardrobe();
  const { showSuccess, showError, showConfirm } = useToast();

  // 日历状态
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDates, setCalendarDates] = useState<CalendarDate[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // 弹窗状态
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDiary, setCurrentDiary] = useState<DiaryData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState<Partial<DiaryData>>({
    weather: '晴天',
    mood: '开心',
    notes: '',
    clothingIds: [],
  });

  // 已保存搭配
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [showOutfitSelector, setShowOutfitSelector] = useState(false);
  const [loadingOutfits, setLoadingOutfits] = useState(false);

  // ==================== 工具函数 ====================
  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // ==================== 数据加载 ====================
  const loadCalendarData = useCallback(async () => {
    setLoadingCalendar(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const data = await diaryApi.getCalendar(year, month);

      const dateMap = new Map(data.dates.map(d => [d.date, d]));

      // 构建完整的日历数据
      const daysInMonth = getDaysInMonth(year, month - 1);
      const dates: CalendarDate[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = dateMap.get(dateStr);
        dates.push({
          date: dateStr,
          hasEntry: !!entry,
          hasPhoto: entry?.hasPhoto || false,
          hasOutfit: entry?.hasOutfit || false,
          mood: entry?.mood,
        });
      }

      setCalendarDates(dates);
    } catch (error) {
      console.error('加载日历数据失败:', error);
    } finally {
      setLoadingCalendar(false);
    }
  }, [currentDate]);

  const loadSavedOutfits = async () => {
    setLoadingOutfits(true);
    try {
      const outfits = await outfitsApi.getAll();
      setSavedOutfits(outfits || []);
    } catch (error) {
      console.error('加载搭配失败:', error);
    } finally {
      setLoadingOutfits(false);
    }
  };

  // 组件挂载时加载日历数据
  React.useEffect(() => {
    loadCalendarData();
  }, []);

  // 监听弹窗关闭，刷新日历数据
  useEffect(() => {
    if (!isModalOpen) {
      loadCalendarData();
    }
  }, [isModalOpen]);

  // ==================== 事件处理 ====================
  const handleDateClick = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsModalOpen(true);
    setShowOutfitSelector(false);

    try {
      // 获取该日期的日记
      const diary = await diaryApi.getByDate(dateStr);

      if (diary) {
        setCurrentDiary(diary);
        setFormData({
          weather: diary.weather || '晴天',
          mood: diary.mood || '开心',
          notes: diary.notes || '',
          clothingIds: diary.clothingIds || [],
          photo: diary.photo,
          outfitId: diary.outfitId,
        });
        setIsEditing(false);
      } else {
        setCurrentDiary(null);
        setFormData({
          weather: '晴天',
          mood: '开心',
          notes: '',
          clothingIds: [],
        });
        setIsEditing(true);
      }
    } catch (error) {
      showError('加载日记失败');
    }
  };

  const handleSaveDiary = async () => {
    if (!selectedDate) return;

    try {
      await diaryApi.upsert({
        date: selectedDate,
        weather: formData.weather,
        mood: formData.mood,
        notes: formData.notes,
        clothingIds: formData.clothingIds,
        photo: formData.photo,
        outfitId: formData.outfitId,
      });

      showSuccess('日记保存成功');
      setIsEditing(false);

      // 强制刷新日历数据
      await loadCalendarData();

      // 刷新当前日记数据
      const updated = await diaryApi.getByDate(selectedDate);
      if (updated) {
        setCurrentDiary(updated);
      }
    } catch (error) {
      console.error('保存日记失败:', error);
      showError('保存失败，请重试');
    }
  };

  const handleDeleteDiary = async () => {
    if (!currentDiary?.id) return;

    const confirmed = await showConfirm({
      title: '删除日记',
      message: '确定要删除这条日记吗？删除后无法恢复。',
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await diaryApi.delete(currentDiary.id);
      showSuccess('日记已删除');
      setIsModalOpen(false);
      await loadCalendarData();
    } catch (error) {
      showError('删除失败');
    }
  };

  const handleSelectOutfit = (outfit: SavedOutfit) => {
    // 从搭配中提取服装IDs
    const clothingIds: string[] = [];
    if (outfit.dressId) clothingIds.push(outfit.dressId);
    if (outfit.topId) clothingIds.push(outfit.topId);
    if (outfit.bottomId) clothingIds.push(outfit.bottomId);
    if (outfit.shoesId) clothingIds.push(outfit.shoesId);

    setFormData(prev => ({
      ...prev,
      clothingIds,
      outfitId: outfit.id,
      photo: outfit.tryonImage || prev.photo,
    }));

    setShowOutfitSelector(false);
    showSuccess('已导入搭配');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, photo: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // ==================== 渲染辅助函数 ====================
  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = formatDate(new Date());

    const days = [];

    // 空白占位（上个月）
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 md:h-20" />);
    }

    // 日期格子
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const calendarDate = calendarDates.find(d => d.date === dateStr);
      const isToday = dateStr === today;

      days.push(
        <button
          key={dateStr}
          onClick={() => handleDateClick(dateStr)}
          className={`
            relative h-14 md:h-20 rounded-xl border-2 transition-all duration-200
            flex flex-col items-center justify-start pt-1
            ${isToday
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
            }
            ${calendarDate?.hasEntry ? 'bg-white shadow-sm' : ''}
          `}
        >
          <span className={`
            text-sm font-medium
            ${isToday ? 'text-indigo-600' : 'text-slate-700'}
            ${calendarDate?.hasEntry ? 'font-bold' : ''}
          `}>
            {day}
          </span>

          {/* 标记指示器 */}
          <div className="flex gap-0.5 mt-1">
            {calendarDate?.hasPhoto && (
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
            )}
            {calendarDate?.hasOutfit && (
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            )}
            {calendarDate?.hasEntry && !calendarDate?.hasPhoto && !calendarDate?.hasOutfit && (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </div>

          {/* 心情表情 */}
          {calendarDate?.mood && (
            <span className="text-xs mt-0.5">
              {MOOD_OPTIONS.find(m => m.value === calendarDate.mood)?.emoji || '✨'}
            </span>
          )}
        </button>
      );
    }

    return days;
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // ==================== 渲染 ====================
  return (
    <div className="p-4 pb-28 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold font-serif text-slate-800">穿搭日记</h2>
          <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-xs font-bold uppercase">OOTD</span>
        </div>
      </div>

      {/* 日历卡片 */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* 日历头部 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="p-3 -ml-2 hover:bg-white/20 rounded-full transition-colors active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-xl font-bold">
              {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
            </span>
            <button
              onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="p-3 -mr-2 hover:bg-white/20 rounded-full transition-colors active:scale-95"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium opacity-80">
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* 日历格子 */}
        <div className="p-4">
          {loadingCalendar ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarGrid()}
            </div>
          )}
        </div>

        {/* 图例 */}
        <div className="px-4 pb-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>有记录</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-pink-400" />
            <span>有照片</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>有搭配</span>
          </div>
        </div>
      </div>

      {/* 日记弹窗 */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {parseInt(selectedDate.split('-')[1])}月{parseInt(selectedDate.split('-')[2])}日
                </h3>
                <p className="text-sm text-slate-500">
                  {currentDiary ? '已记录穿搭' : '记录今日穿搭'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentDiary && !isEditing && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                      title="编辑"
                    >
                      <Sparkles size={20} />
                    </button>
                    <button
                      onClick={handleDeleteDiary}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      title="删除"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                  title="关闭"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isEditing ? (
                // 编辑模式
                <>
                  {/* 天气选择 */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                      <CloudSun size={16} />
                      天气
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {WEATHER_OPTIONS.map(option => {
                        const Icon = option.icon;
                        const isSelected = formData.weather === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setFormData(prev => ({ ...prev, weather: option.value }))}
                            className={`
                              flex items-center gap-1 px-3 py-2 rounded-xl text-sm transition-all
                              ${isSelected
                                ? `${option.bg} ${option.color} ring-2 ring-offset-1 ring-indigo-300`
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                              }
                            `}
                          >
                            <Icon size={16} />
                            {option.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 心情选择 */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                      <Smile size={16} />
                      心情
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {MOOD_OPTIONS.map(option => {
                        const isSelected = formData.mood === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setFormData(prev => ({ ...prev, mood: option.value }))}
                            className={`
                              flex items-center gap-1 px-3 py-2 rounded-xl text-sm transition-all
                              ${isSelected
                                ? `${option.color} ring-2 ring-offset-1 ring-indigo-300`
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                              }
                            `}
                          >
                            <span>{option.emoji}</span>
                            {option.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 导入搭配 */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                      <BookmarkPlus size={16} />
                      从搭配导入
                    </label>
                    <button
                      onClick={() => {
                        setShowOutfitSelector(true);
                        loadSavedOutfits();
                      }}
                      className="w-full py-3 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      {formData.outfitId ? '更换搭配' : '选择已保存搭配'}
                    </button>

                    {formData.outfitId && (
                      <p className="text-xs text-slate-500 mt-1">
                        已选择搭配
                      </p>
                    )}
                  </div>

                  {/* 已选服装 */}
                  {formData.clothingIds && formData.clothingIds.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2">今日穿搭</label>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {formData.clothingIds.map(id => {
                          const item = getById(id);
                          return item ? (
                            <div key={id} className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-50">
                              <ImageRenderer
                                src={item.imageFront}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                fallbackText={item.name}
                              />
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* 照片上传 */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                      <Camera size={16} />
                      照片
                    </label>
                    {formData.photo ? (
                      <div className="relative aspect-[9/16] max-h-48 rounded-xl overflow-hidden bg-slate-100">
                        <ImageRenderer
                          src={formData.photo}
                          alt="穿搭照片"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, photo: undefined }))}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="block aspect-[9/16] max-h-32 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                        <Camera size={32} className="text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500">上传照片</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* 备注 */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2">备注</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="记录今天的感受..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                    />
                  </div>
                </>
              ) : (
                // 查看模式
                currentDiary && (
                  <>
                    {/* 天气和心情 */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                        {(() => {
                          const weather = WEATHER_OPTIONS.find(w => w.value === currentDiary.weather);
                          const Icon = weather?.icon || Sun;
                          return <Icon size={20} className={weather?.color || 'text-amber-500'} />;
                        })()}
                        <span className="text-sm font-medium text-slate-700">{currentDiary.weather}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                        <span className="text-lg">
                          {MOOD_OPTIONS.find(m => m.value === currentDiary.mood)?.emoji || '✨'}
                        </span>
                        <span className="text-sm font-medium text-slate-700">{currentDiary.mood}</span>
                      </div>
                    </div>

                    {/* 照片 */}
                    {currentDiary.photo && (
                      <div className="aspect-[9/16] max-h-64 rounded-xl overflow-hidden bg-slate-100">
                        <ImageRenderer
                          src={currentDiary.photo}
                          alt="穿搭照片"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* 穿搭单品 */}
                    {currentDiary.clothingItems && currentDiary.clothingItems.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2">今日穿搭</label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {currentDiary.clothingItems.map((item: any) => (
                            <div key={item.id} className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-50">
                              <ImageRenderer
                                src={item.imageFront}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 备注 */}
                    {currentDiary.notes && (
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-slate-600 text-sm leading-relaxed">{currentDiary.notes}</p>
                      </div>
                    )}
                  </>
                )
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="p-4 border-t border-slate-100">
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDiary}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    保存日记
                  </button>
                  {currentDiary && (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-3 bg-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-300"
                    >
                      取消
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-all"
                >
                  编辑日记
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 搭配选择器弹窗 */}
      {showOutfitSelector && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowOutfitSelector(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">选择搭配</h3>
              <button
                onClick={() => setShowOutfitSelector(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingOutfits ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                </div>
              ) : savedOutfits.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <BookmarkPlus size={48} className="mx-auto mb-4 opacity-50" />
                  <p>还没有保存的搭配</p>
                  <p className="text-sm mt-2">去搭配页面生成并保存搭配</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {savedOutfits.map(outfit => (
                    <button
                      key={outfit.id}
                      onClick={() => handleSelectOutfit(outfit)}
                      className="aspect-[9/16] rounded-xl overflow-hidden bg-slate-50 relative group hover:ring-2 hover:ring-indigo-400 transition-all"
                    >
                      {outfit.tryonImage ? (
                        <ImageRenderer
                          src={outfit.tryonImage}
                          alt={outfit.name || '搭配'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <BookmarkPlus size={24} className="mb-1" />
                          <span className="text-xs px-2 text-center line-clamp-2">
                            {outfit.name || '未命名搭配'}
                          </span>
                        </div>
                      )}
                      {outfit.name && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-white text-xs truncate">{outfit.name}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diary;
