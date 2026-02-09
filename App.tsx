/**
 * ==================== App Component (Refactored with Context) ====================
 * 使用 AppProvider 和 Context 管理全局状态
 */

import React, { useState } from 'react';
import { ViewState } from './types';
import WardrobeGallery from './components/WardrobeGallery';
import BodyProfileComponent from './components/BodyProfile';
import Stylist from './components/Stylist';
import Analytics from './components/Analytics';
import ClothingCalendar from './components/ClothingCalendar';
import { Shirt, User, Sparkles, BarChart2, CalendarDays } from 'lucide-react';
import { AppProvider, useApp } from './src/context/AppContext';
import { Loader2, LogIn } from 'lucide-react';

// ==================== Main App with Provider ====================
const AppWithProvider: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

// ==================== App Content Component ====================
const AppContent: React.FC = () => {
  const [view, setView] = useState<ViewState>('wardrobe');
  const { user, loading, login, logout } = useApp();

  // 登录界面
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50 text-slate-600 gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <div className="text-sm font-medium animate-pulse">正在初始化...</div>
      </div>
    );
  }

  // 未登录显示登录界面
  if (!user || !user.isLoggedIn) {
    return <LoginView onLogin={login} />;
  }

  // 已登录显示主界面
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-slate-50 to-indigo-50 text-slate-900 font-sans selection:bg-rose-200 overflow-hidden">
      <main className="w-[393px] h-[852px] mx-auto bg-white/50 backdrop-blur-xl shadow-2xl overflow-hidden relative border-x border-white/40">

        {/* 顶部用户信息 */}
        <div className="fixed top-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-b border-slate-100 flex justify-between items-center z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
              {user?.profile?.name?.[0] || 'U'}
            </div>
            <span className="text-sm font-medium text-slate-600">{user?.profile?.name || '用户'}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="退出登录"
          >
            <LogIn size={18} className="rotate-180" />
          </button>
        </div>

        {/* Views */}
        <div className="animate-fade-in h-[calc(100vh-120px)] overflow-y-auto no-scrollbar pt-12">
          {view === 'wardrobe' && user && (
            <WardrobeGallery />
          )}
          {view === 'profile' && user && (
            <BodyProfileComponent />
          )}
          {view === 'stylist' && user && (
            <Stylist />
          )}
          {view === 'calendar' && user && (
            <ClothingCalendar />
          )}
          {view === 'analytics' && user && (
            <Analytics />
          )}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl shadow-slate-200/50 border border-white/50 flex justify-between items-center px-4 py-3 z-50 max-w-[365px] mx-auto">
          <NavButton active={view === 'wardrobe'} onClick={() => setView('wardrobe')} icon={<Shirt size={22} />} label="衣橱" />
          <NavButton active={view === 'stylist'} onClick={() => setView('stylist')} icon={<Sparkles size={22} />} label="搭配" />
          <NavButton active={view === 'calendar'} onClick={() => setView('calendar')} icon={<CalendarDays size={22} />} label="记录" />
          <NavButton active={view === 'analytics'} onClick={() => setView('analytics')} icon={<BarChart2 size={22} />} label="分析" />
          <NavButton active={view === 'profile'} onClick={() => setView('profile')} icon={<User size={22} />} label="我的" />
        </nav>
      </main>
    </div>
  );
};

// ==================== Login View Component ====================
const LoginView: React.FC<{ onLogin: (email: string, password: string, username?: string) => Promise<void> }> = ({ onLogin }) => {
  const [loginForm, setLoginForm] = useState({ email: '', password: '', username: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      await onLogin(loginForm.email, loginForm.password, isRegister ? loginForm.username : undefined);
    } catch (e: any) {
      setLoginError(e.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-indigo-500 bg-clip-text text-transparent">
            Lumina Closet
          </h1>
          <p className="text-slate-500 mt-2">AI智能衣橱助手</p>
        </div>

        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          {isRegister ? '创建账户' : '登录账户'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="用户名"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              value={loginForm.username}
              onChange={e => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
              required={isRegister}
            />
          )}
          <input
            type="email"
            placeholder="邮箱"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            value={loginForm.email}
            onChange={e => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="密码"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            value={loginForm.password}
            onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
            required
          />

          {loginError && (
            <div className="text-red-500 text-sm text-center">{loginError}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {isLoading ? '处理中...' : (isRegister ? '注册' : '登录')}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full mt-4 text-slate-500 text-sm hover:text-indigo-500 transition-colors"
        >
          {isRegister ? '已有账户？去登录' : '没有账户？去注册'}
        </button>
      </div>
    </div>
  );
};

// ==================== Navigation Button Component ====================
const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <div className={`${active ? 'fill-current' : ''}`}>{icon}</div>
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
    {active && <div className="w-1 h-1 rounded-full bg-indigo-600 mt-0.5"></div>}
  </button>
);

export default AppWithProvider;
