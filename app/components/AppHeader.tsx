import React from 'react';
import type { User } from '../types';
import type { Deck } from '../types';
import StyledSelect from './StyledSelect';

interface AppHeaderProps {
  user: User | null;
  isDark: boolean;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<'home' | 'study' | 'test' | 'manage' | 'shared' | 'dashboard'>>;
  setAuthMode: (mode: 'login' | 'signup' | null) => void;
  handleLogout: (setActiveTab: React.Dispatch<React.SetStateAction<'home' | 'study' | 'test' | 'manage' | 'shared' | 'dashboard'>>) => void;
  toggleTheme: () => void;
  streak: number;
  dailyGoal: number;
  dailyMissions: {
    studyCount: number;
    testCompleted: boolean;
    speakCompleted: boolean;
  };
  userHobby: string;
  avatarUrl: string | null;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  setIsProfileOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  avatarButtonRef: React.RefObject<HTMLButtonElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  decks: Deck[];
  currentDeckId: string | null;
  setCurrentDeckId: (id: string | null) => void;
}

export default function AppHeader({
  user,
  isDark,
  activeTab,
  setActiveTab,
  setAuthMode,
  handleLogout,
  toggleTheme,
  streak,
  dailyGoal,
  dailyMissions,
  userHobby,
  avatarUrl,
  isUserMenuOpen,
  setIsUserMenuOpen,
  setIsProfileOpen,
  setIsSettingsOpen,
  avatarButtonRef,
  menuRef,
  decks,
  currentDeckId,
  setCurrentDeckId,
}: AppHeaderProps) {
  return (
    <header className={`px-6 py-3.5 border-b flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-xs relative z-50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between w-full md:w-auto md:gap-6">
        <div className="flex items-center gap-4">
          <span className={`text-base font-black tracking-wider flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            FLIP-N <span className="text-blue-500">PRO</span>
          </span>

          <div className={`text-[10px] font-mono tracking-wide px-2.5 py-0.5 rounded border flex items-center gap-1.5 ${isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{streak} DAYS</span>
          </div>

        </div>

        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <button onClick={() => handleLogout(setActiveTab)} className="text-[10px] font-mono border rounded px-2.5 py-1.5 hover:bg-red-500/10 hover:text-red-500 border-slate-700">LOGOUT</button>
          ) : (
            <button onClick={() => setAuthMode('login')} className="text-[10px] font-mono border rounded px-2.5 py-1.5 bg-blue-600 text-white border-blue-600">SIGN IN</button>
          )}
          <button onClick={toggleTheme} className={`p-2 rounded-lg border flex items-center justify-center ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            {isDark ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between md:justify-end gap-4 w-full md:w-auto md:gap-6">
        {user && (
          <StyledSelect
            ariaLabel="学習するデッキ"
            value={currentDeckId || ''}
            onChange={(value) => setCurrentDeckId(value || null)}
            options={[{ value: '', label: '未分類のカード' }, ...decks.map((deck) => ({ value: deck.id, label: deck.title }))]}
            isDark={isDark}
            className="w-full md:w-48"
          />
        )}
        <nav className={`flex p-1 rounded-xl border overflow-x-auto w-full md:w-auto ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-100 border-slate-200'}`}>
          {[
            { id: 'home', label: 'HOME', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg> },
            { id: 'study', label: 'STUDY', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
            { id: 'test', label: 'TEST', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { id: 'manage', label: 'MANAGE', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { id: 'shared', label: 'SHARED', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg> },
            { id: 'dashboard', label: 'ANALYTICS', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2zm12 0v-11a2 2 0 00-2-2h-2a2 2 0 00-2 2v11a2 2 0 002 2h2a2 2 0 002-2z" /></svg> },
            ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'home' | 'study' | 'test' | 'manage' | 'shared' | 'dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id ? (isDark ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600 shadow-xs') : (isDark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                ref={avatarButtonRef}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 transition-all"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {(user?.displayName || 'U').slice(0, 1).toUpperCase()}
                  </div>
                )}
              </button>

              {isUserMenuOpen && (
                <div
                  ref={menuRef}
                  className={`absolute right-0 mt-3 w-64 rounded-2xl border shadow-xl z-50 overflow-hidden backdrop-blur-md transition-all ${isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800'}`}
                >
                  <div className={`p-4 flex items-center gap-3 border-b ${isDark ? 'border-slate-800/60 bg-slate-950/40' : 'border-slate-50 bg-slate-50/60'}`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 flex-shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {(user?.displayName || 'U').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold tracking-wide truncate">{user?.displayName || 'ゲストユーザー'}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5 text-[11px] font-medium border-b border-slate-100 dark:border-slate-800/60">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> 継続日数
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{streak} 日</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 今日の目標
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {Math.min(100, Math.round((dailyMissions.studyCount / dailyGoal) * 100))}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> マイブーム
                      </span>
                      <span className="px-2 py-0.5 text-[10px] rounded-md bg-slate-100 dark:bg-slate-800 font-bold max-w-[100px] truncate">
                        {userHobby || '未設定'}
                      </span>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => { setIsProfileOpen(true); setIsUserMenuOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${isDark ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                    >
                      プロフィール編集
                    </button>

                    <button
                      onClick={() => { setIsSettingsOpen(true); setIsUserMenuOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${isDark ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                    >
                      アプリ環境設定
                    </button>

                    <div className={`my-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`} />

                    <button
                      onClick={() => handleLogout(setActiveTab)}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all"
                    >
                      サインアウト
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthMode('login')}
              className="text-[10px] font-mono border rounded px-3 py-1.5 bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-500 transition"
            >
              SIGN IN
            </button>
          )}

          <button onClick={toggleTheme} className={`p-2 rounded-lg border flex items-center justify-center transition hover:scale-105 ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
            {isDark ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
        </div>
      </div>
    </header>
  );
}
