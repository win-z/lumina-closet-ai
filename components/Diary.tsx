/**
 * ==================== Diary Component (Refactored) ====================
 * 使用 useDiary 和 useWardrobe hooks 管理数据
 */

import React, { useState } from 'react';
import { useDiary } from '../src/hooks/useDiary';
import { useWardrobe } from '../src/hooks/useWardrobe';
import ImageRenderer from './ImageRenderer';
import { Calendar, Trash2, CloudSun, Smile, Edit2, Save, X } from 'lucide-react';

const Diary: React.FC = () => {
  const { entries, add } = useDiary();
  const { items: wardrobe, getById } = useWardrobe();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<any>>({});

  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getItem = (id: string) => {
    return getById(id);
  };

  return (
    <div className="p-4 pb-28 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold font-serif text-slate-800">穿搭日记</h2>
        <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-xs font-bold uppercase">OOTD</span>
      </div>

      {sortedEntries.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p>还没有日记记录</p>
          <p className="text-sm mt-2">去搭配页面生成穿搭建议并保存</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedEntries.map(entry => (
            <div key={entry.id} className="bg-white rounded-2xl shadow-lg p-4 space-y-3">
              {/* Entry Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-800">{entry.date}</span>
                  <span className="text-slate-400">·</span>
                  <div className="flex items-center gap-1 text-slate-500">
                    <CloudSun size={16} />
                    <span className="text-sm">{entry.weather}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Smile size={16} />
                    <span className="text-sm">{entry.mood}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (confirm("确定删除这条日记吗？")) {
                        // deleteEntry(entry.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Clothing Items */}
              {entry.clothingIds && entry.clothingIds.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {entry.clothingIds.map(id => {
                    const item = getItem(id);
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
              )}

              {/* Notes */}
              {entry.notes && (
                <p className="text-slate-600 text-sm">{entry.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Diary;
