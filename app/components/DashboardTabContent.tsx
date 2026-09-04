import React from 'react';
import { motion } from 'framer-motion';
import type { Card } from '../types';

interface DashboardTabContentProps {
  cards: Card[];
  streak: number;
  subContainerClass: string;
  isDark: boolean;
  dailyMissions: {
    studyCount: number;
    testCompleted: boolean;
    speakCompleted: boolean;
  };
  studyLogs: Record<string, number>;
  theme: 'dark' | 'light';
  setShowShareModal: (value: boolean) => void;
  mastery: number;
  mainTabMasteredCards: number;
  deckProgress: Array<{ deckId: string | null; title: string; total: number; mastered: number; due: number }>;
}

export default function DashboardTabContent({
  cards,
  streak,
  subContainerClass,
  isDark,
  dailyMissions,
  studyLogs,
  theme,
  setShowShareModal,
  mastery,
  mainTabMasteredCards,
  deckProgress,
}: DashboardTabContentProps) {
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dateKey = date.toISOString().split('T')[0];
    return {
      day: date.toLocaleDateString('ja-JP', { weekday: 'short' }),
      count: studyLogs[dateKey] || 0,
      dateKey,
    };
  });
  const weeklyMax = Math.max(...weeklyActivity.map((item) => item.count), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-blue-500 uppercase">Learning analytics</p>
          <h2 className="text-2xl font-black tracking-tight mt-1">学習の進み具合</h2>
          <p className="text-xs text-slate-400 mt-1">デッキごとの習得状況と、最近の学習活動を確認できます。</p>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="sm:w-auto px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 uppercase tracking-wider"
        >
          📸 実績をシェア
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`min-w-0 p-4 rounded-2xl border text-center ${subContainerClass}`}>
          <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider block uppercase mb-1">Total Deck Size</span>
          <span className="text-xl font-black tracking-tight">{cards.length}</span>
          <span className="text-[8px] font-mono text-slate-400 block mt-0.5">CARDS INSTALLED</span>
        </div>
        <div className={`min-w-0 p-4 rounded-2xl border text-center ${subContainerClass}`}>
          <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider block uppercase mb-1">Mastery Rate</span>
          <span className="text-xl font-black tracking-tight text-blue-400">{mastery}%</span>
          <span className="text-[8px] font-mono text-slate-400 block mt-0.5">{mainTabMasteredCards} CARDS MASTERED</span>
        </div>
        <div className={`min-w-0 p-4 rounded-2xl border text-center ${subContainerClass}`}>
          <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider block uppercase mb-1">Current Streak</span>
          <span className="text-xl font-black tracking-tight text-orange-500">{streak} 🔥</span>
          <span className="text-[8px] font-mono text-slate-400 block mt-0.5">DAYS LEARNING IN A ROW</span>
        </div>
      </div>

      <section className={`min-w-0 p-5 rounded-2xl border ${subContainerClass}`}>
        <h3 className="text-xs font-bold font-mono tracking-widest text-blue-500 mb-4 uppercase">DECK PROGRESS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {deckProgress.length === 0 ? (
            <p className="text-xs text-slate-400">まだデッキにカードがありません。</p>
          ) : deckProgress.map((deck) => {
            const progress = deck.total > 0 ? Math.round((deck.mastered / deck.total) * 100) : 0;
            return (
              <div key={deck.deckId || 'unassigned'}>
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="truncate">{deck.title}</span>
                  <span className="text-slate-400 font-mono ml-3 shrink-0">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex gap-3 mt-1 text-[10px] text-slate-500 font-mono">
                  <span>{deck.mastered}/{deck.total} mastered</span>
                  <span>{deck.due} due today</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-6 items-stretch">
      <div className={`min-w-0 min-h-[19rem] p-6 rounded-2xl border ${subContainerClass} space-y-4 flex flex-col`}>
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold font-mono tracking-widest text-blue-500 uppercase">🎯 DAILY MISSIONS</h3>
            <p className="text-[11px] text-slate-400">毎日の学習目標を確認しましょう。</p>
          </div>
        </div>

        <div className="space-y-3 font-mono flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs">
            <span className={dailyMissions.studyCount >= 10 ? 'text-green-400 line-through' : 'text-slate-300'}>
              {dailyMissions.studyCount >= 10 ? '✅' : '⚡'} カードを10枚学習する
            </span>
            <span className="text-slate-500 text-[11px]">{dailyMissions.studyCount} / 10</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={dailyMissions.testCompleted ? 'text-green-400 line-through' : 'text-slate-300'}>
              {dailyMissions.testCompleted ? '✅' : '⚡'} クイズテストに1回挑戦する
            </span>
            <span className="text-slate-500 text-[11px]">{dailyMissions.testCompleted ? '1 / 1' : '0 / 1'}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={dailyMissions.speakCompleted ? 'text-green-400 line-through' : 'text-slate-300'}>
              {dailyMissions.speakCompleted ? '✅' : '⚡'} 音声チェックを1回以上試す
            </span>
            <span className="text-slate-500 text-[11px]">{dailyMissions.speakCompleted ? '1 / 1' : '0 / 1'}</span>
          </div>
        </div>
      </div>

      <div className={`min-w-0 min-h-[19rem] p-6 rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="font-bold tracking-tight text-sm">学習ヒートマップ (直近12週間)</h3>
        </div>

        <div className="grid grid-cols-7 gap-1.5 p-1 w-full">
          {Array.from({ length: 84 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (83 - i));
            const dateStr = d.toISOString().split('T')[0];
            const count = studyLogs[dateStr] || 0;

            let bgClass = theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-100';
            if (count > 0 && count <= 3) bgClass = 'bg-emerald-900/40 text-emerald-400';
            if (count > 3 && count <= 10) bgClass = 'bg-emerald-700/60 text-emerald-300';
            if (count > 10) bgClass = 'bg-emerald-500 text-white';

            return (
              <div
                key={i}
                className={`aspect-square w-full max-w-[18px] rounded-sm sm:rounded-[3px] ${bgClass} transition-all duration-300 hover:scale-125 cursor-pointer relative group justify-self-center`}
                title={`${dateStr}: ${count}問学習`}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-zinc-950 text-white text-[10px] py-1 px-2 rounded font-mono whitespace-nowrap z-50 shadow-xl border border-zinc-800">
                  {dateStr} ({count}問)
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end items-center gap-1.5 mt-3 text-[10px] text-zinc-500 font-mono">
          <span>Less</span>
          <div className={`w-2.5 h-2.5 rounded-sm ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}></div>
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-900/40"></div>
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-700/60"></div>
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>
          <span>More</span>
        </div>
      </div>
      </div>

      <div className={`border rounded-2xl p-5 ${subContainerClass}`}>
        <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 mb-6">WEEKLY LEARNING ACTIVITY</h3>

        <div className="h-36 flex items-end justify-between gap-2.5 px-1 pt-4">
          {weeklyActivity.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 bg-slate-800 text-white border border-slate-700 text-[9px] font-mono px-1.5 py-0.5 rounded shadow-xl z-10 pointer-events-none">
                {item.dateKey}: {item.count}枚
              </div>
              <div className={`w-full rounded-t-md relative overflow-hidden h-full flex items-end ${isDark ? 'bg-slate-800/40' : 'bg-slate-200/50'}`}>
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.04 }}
                  style={{ height: `${Math.max(item.count > 0 ? (item.count / weeklyMax) * 100 : 4, 4)}%` }}
                  className={`w-full origin-bottom rounded-t-md ${index === weeklyActivity.length - 1 ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : isDark ? 'bg-slate-700 group-hover:bg-slate-600' : 'bg-slate-400 group-hover:bg-slate-500'}`}
                />
              </div>
              <span className={`text-[10px] font-mono ${index === weeklyActivity.length - 1 ? 'text-blue-500 font-bold' : 'text-slate-500'}`}>{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
