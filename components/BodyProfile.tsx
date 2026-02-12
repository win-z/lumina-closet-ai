/**
 * ==================== BodyProfile Component (Refactored) ====================
 * 使用 useProfile hook 管理用户档案
 */

import React, { useState } from 'react';
import { useProfile } from '../src/hooks/useProfile';
import { useToast } from '../src/context/ToastContext';
import ImageRenderer from './ImageRenderer';
import { Camera, User, Ruler, Plus, Check } from 'lucide-react';

const BodyProfile: React.FC = () => {
  const { profile, update, isLoggedIn } = useProfile();
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'scan'>('details');
  const [newUserName, setNewUserName] = useState("");

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
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold font-serif text-slate-800">身体档案</h2>
        <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-xs font-bold uppercase">Profile</span>
      </div>

      {/* Profile Content */}
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-rose-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
            {profile?.name?.[0] || 'U'}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-800">{profile?.name || '默认用户'}</h3>
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
    </div>
  );
};

export default BodyProfile;
