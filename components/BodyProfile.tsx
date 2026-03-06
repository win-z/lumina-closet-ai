/**
 * ==================== BodyProfile Component (Refactored) ====================
 * 使用 useProfile hook 管理用户档案
 */

declare const __BUILD_TIME__: string;
declare const __APP_VERSION__: string;

import React, { useState } from 'react';
import { useProfile } from '../src/hooks/useProfile';
import { useToast } from '../src/context/ToastContext';
import { useApp } from '../src/context/AppContext';
import ImageRenderer from './ImageRenderer';
import { Camera, User, Ruler, Edit, Info, LogIn } from 'lucide-react';

const BodyProfile: React.FC = () => {
  const { profile, update, isLoggedIn } = useProfile();
  const { logout } = useApp();
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'scan'>('details');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [tempName, setTempName] = useState("");

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, view: 'photoFront' | 'photoSide' | 'photoBack') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        await update({ [view]: base64 } as any);
        showSuccess('照片保存成功');
      } catch (err) {
        console.error("Failed to save profile image", err);
        showError("图片保存失败");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (updates: any) => {
    try {
      await update(updates);
      showSuccess('档案更新成功');
    } catch (err) {
      console.error("Failed to update profile", err);
      showError("更新失败");
    }
  };

  return (
    <div className="p-4 pb-28 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold font-serif text-slate-800">身体档案</h2>
          <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-xs font-bold uppercase">Profile</span>
        </div>
        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 text-sm font-medium"
          title="退出登录"
        >
          <span>退出登录</span>
          <LogIn size={18} className="rotate-180" />
        </button>
      </div>

      {/* Profile Content */}
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-rose-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {profile?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            {activeTab === 'details' && (
              <div className="flex items-center gap-2 group">
                <h3 className="text-xl font-semibold text-slate-800 truncate">
                  {profile?.name || '默认用户'}
                </h3>
                <button
                  onClick={() => {
                    setTempName(profile?.name || "");
                    setIsNameModalOpen(true);
                  }}
                  className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                  title="修改昵称"
                >
                  <Edit size={16} />
                </button>
              </div>
            )}
            <p className="text-slate-500 text-sm">{isLoggedIn ? '已登录' : '本地用户'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Ruler size={20} className="text-indigo-500" />
            <div className="flex-1">
              <label className="text-sm text-slate-500">身高</label>
              <input
                type="number"
                value={profile?.heightCm || 170}
                onChange={(e) => handleUpdateProfile({ heightCm: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>
            <span className="text-slate-400">cm</span>
          </div>

          <div className="flex items-center gap-3">
            <User size={20} className="text-rose-500" />
            <div className="flex-1">
              <label className="text-sm text-slate-500">体重</label>
              <input
                type="number"
                value={profile?.weightKg || 60}
                onChange={(e) => handleUpdateProfile({ weightKg: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>
            <span className="text-slate-400">kg</span>
          </div>
        </div>

        {/* Photos Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-700">身形照片</h4>
          <div className="grid grid-cols-3 gap-3">
            {['photoFront', 'photoSide', 'photoBack'].map((view) => (
              <div key={view} className="aspect-[9/16] bg-slate-50 rounded-lg overflow-hidden relative group">
                <ImageRenderer
                  src={profile?.[view as keyof typeof profile] as string}
                  alt={view}
                  aspectRatio="9/16"
                  className="w-full h-full"
                  fallbackText={view === 'photoFront' ? '正面' : view === 'photoSide' ? '侧面' : '背面'}
                />
                <label className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <Camera size={24} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, view as any)}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 版本信息 */}
      <div className="mt-2 bg-white/60 rounded-2xl p-4 flex items-start gap-3 border border-slate-100">
        <Info size={16} className="text-slate-300 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-slate-400">应用版本</p>
          <p className="text-xs text-slate-500 font-mono">v{__APP_VERSION__}</p>
          <p className="text-xs text-slate-400">
            构建时间：{new Date(__BUILD_TIME__).toLocaleString('zh-CN', {
              timeZone: 'Asia/Shanghai',
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
              hour12: false
            })}
          </p>
        </div>
      </div>

      {/* 修改昵称弹窗 */}
      {isNameModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsNameModalOpen(false)}
          />
          <div className="relative w-full max-w-[320px] bg-white rounded-2xl shadow-2xl p-6 space-y-4 animate-scale-in">
            <h4 className="text-lg font-bold text-slate-800">修改昵称</h4>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="请输入新昵称"
              autoFocus
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsNameModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (tempName.trim()) {
                    handleUpdateProfile({ name: tempName.trim() });
                    setIsNameModalOpen(false);
                  }
                }}
                className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 shadow-md shadow-indigo-200 transition-all active:scale-95"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyProfile;
