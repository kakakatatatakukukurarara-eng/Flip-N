import React from 'react';
import { motion } from 'framer-motion';

interface DashboardTabContentProps {
  cards: any[];
  streak: number;
  level: number;
  title: string;
  subContainerClass: string;
  isDark: boolean;
  innerBoxClass: string;
  leaderboard: Array<{ name: string; words: number }>;
  isRankingLoading: boolean;
  fetchRealRanking: () => void;
  aiCharacter: string;
  setAiCharacter: (character: string) => void;
  aiMessage: string;
  setAiMessage: (message: string) => void;
  flipCoins: number;
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
}

export default function DashboardTabContent({
  cards,
  streak,
  level,
  title,
  subContainerClass,
  isDark,
  innerBoxClass,
  leaderboard,
  isRankingLoading,
  fetchRealRanking,
  aiCharacter,
  setAiCharacter,
  aiMessage,
  setAiMessage,
  flipCoins,
  dailyMissions,
  studyLogs,
  theme,
  setShowShareModal,
  mastery,
  mainTabMasteredCards,
}: DashboardTabContentProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 max-w-md mx-auto w-full px-4 py-8 space-y-6">
      <button
        onClick={() => setShowShareModal(true)}
        className="w-full mt-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-mono font-bold text-xs rounded-2xl shadow-lg transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider"
      >
        📸 GENERATE SHARE IMAGE (実績を画像でシェア)
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border text-center ${subContainerClass}`}>
          <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider block uppercase mb-1">Total Deck Size</span>
          <span className="text-xl font-black tracking-tight">{cards.length}</span>
          <span className="text-[8px] font-mono text-slate-400 block mt-0.5">CARDS INSTALLED</span>
        </div>
        <div className={`p-4 rounded-2xl border text-center ${subContainerClass}`}>
          <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider block uppercase mb-1">Mastery Rate</span>
          <span className="text-xl font-black tracking-tight text-blue-400">{mastery}%</span>
          <span className="text-[8px] font-mono text-slate-400 block mt-0.5">{mainTabMasteredCards} CARDS MASTERED</span>
        </div>
        <div className={`p-4 rounded-2xl border text-center ${subContainerClass}`}>
          <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider block uppercase mb-1">Current Streak</span>
          <span className="text-xl font-black tracking-tight text-orange-500">{streak} 🔥</span>
          <span className="text-[8px] font-mono text-slate-400 block mt-0.5">DAYS LEARNING IN A ROW</span>
        </div>
        <div className={`p-4 rounded-2xl border text-center ${subContainerClass}`}>
          <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider block uppercase mb-1">Learning Level</span>
          <span className="text-xl font-black tracking-tight text-purple-400">LV.{level}</span>
          <span className="text-[8px] font-mono text-slate-400 block mt-0.5">RANK: {title}</span>
        </div>
      </div>

      <div className={`p-5 rounded-2xl border mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black font-mono text-purple-500 tracking-wider">🤖 AI STUDY PARTNER</h3>
            <div className="flex gap-1">
              {['🦊', '🤖', '👑'].map((char) => (
                <button
                  key={char}
                  onClick={() => {
                    setAiCharacter(char);
                    setAiMessage(char === '🦊' ? '今日も一歩ずつ進もう！' : char === '🤖' ? '学習データを最適化中。' : 'べ、別に応援なんてしてないわよ！');
                  }}
                  className={`text-xs px-2 py-1 rounded-lg border transition-all ${aiCharacter === char ? 'border-purple-500 bg-purple-500/10 scale-105 font-bold' : 'border-transparent opacity-45'}`}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border text-xs leading-relaxed font-bold flex items-center gap-3 ${isDark ? 'bg-slate-900 border-slate-800 text-purple-300' : 'bg-white border-slate-200 text-purple-700'}`}>
            <span className="text-xl shrink-0">{aiCharacter}</span>
            <p>「{aiMessage}」</p>
          </div>
        </div>
      </div>

      <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-black font-mono text-yellow-500 tracking-wider flex items-center gap-1">🏆 WORLD RANKING</h3>
          <button onClick={fetchRealRanking} className="text-[9px] font-mono text-blue-500 hover:underline">更新 🔄</button>
        </div>

        <div className="space-y-2.5">
          {isRankingLoading ? (
            <div className="text-center py-4 text-xs font-mono text-slate-400 animate-pulse">リアルタイム集計中...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-4 text-xs font-mono text-slate-400">まだ他のデータがありません</div>
          ) : (
            leaderboard.map((player, index) => (
              <div key={index} className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 truncate">
                  <span className={`font-black w-4 text-center text-[10px] rounded px-0.5 ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : index === 1 ? 'bg-slate-400/20 text-slate-400' : 'bg-amber-600/20 text-amber-600'}`}>
                    {index + 1}
                  </span>
                  <span className={`font-bold truncate ${player.name.includes('あなた') ? 'text-blue-500 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                    {player.name}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-yellow-500 shrink-0">
                  {player.words}<span className="text-[9px] text-slate-400 font-normal ml-0.5">単語</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`p-5 rounded-2xl border ${subContainerClass} space-y-4`}>
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold font-mono tracking-widest text-blue-500 uppercase">🎯 DAILY MISSIONS</h3>
            <p className="text-[11px] text-slate-400">毎日クリアしてコインを稼ごう！</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-mono font-bold text-xs rounded-xl shadow-xs">
            <span>🪙</span> {flipCoins} COINS
          </div>
        </div>

        <div className="space-y-3 font-mono">
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
              {dailyMissions.speakCompleted ? '✅' : '⚡'} AI発音分析を1回以上試す
            </span>
            <span className="text-slate-500 text-[11px]">{dailyMissions.speakCompleted ? '1 / 1' : '0 / 1'}</span>
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm mb-6`}>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="font-bold tracking-tight text-sm">学習ヒートマップ (直近12週間)</h3>
        </div>

        <div className="flex flex-wrap gap-1.5 justify-start p-1 overflow-x-auto">
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
                className={`w-[14px] h-[14px] rounded-sm sm:rounded-[3px] ${bgClass} transition-all duration-300 hover:scale-125 cursor-pointer relative group flex-shrink-0`}
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

      <div className={`border rounded-2xl p-5 ${subContainerClass}`}>
        <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 mb-6">WEEKLY LEARNING ACTIVITY</h3>

        <div className="h-28 flex items-end justify-between gap-2.5 px-1 pt-4">
          {[
            { day: 'Mon', count: Math.min(cards.length, 4), height: 'h-[30%]' },
            { day: 'Tue', count: Math.min(cards.length + 2, 8), height: 'h-[55%]' },
            { day: 'Wed', count: Math.min(cards.length, 2), height: 'h-[15%]' },
            { day: 'Thu', count: Math.min(cards.length * 2, 12), height: 'h-[75%]' },
            { day: 'Fri', count: cards.length, height: 'h-[90%]', current: true },
            { day: 'Sat', count: 0, height: 'h-[5%]' },
            { day: 'Sun', count: 0, height: 'h-[5%]' },
          ].map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 bg-slate-800 text-white border border-slate-700 text-[9px] font-mono px-1.5 py-0.5 rounded shadow-xl z-10 pointer-events-none">
                {item.count}枚
              </div>
              <div className={`w-full rounded-t-md relative overflow-hidden h-full flex items-end ${isDark ? 'bg-slate-800/40' : 'bg-slate-200/50'}`}>
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.04 }}
                  className={`w-full ${item.height} origin-bottom rounded-t-md ${item.current ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : isDark ? 'bg-slate-700 group-hover:bg-slate-600' : 'bg-slate-400 group-hover:bg-slate-500'}`}
                />
              </div>
              <span className={`text-[10px] font-mono ${item.current ? 'text-blue-500 font-bold' : 'text-slate-500'}`}>{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
