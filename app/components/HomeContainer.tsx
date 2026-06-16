// src/components/HomeContainer.tsx
import React from 'react';

// プロップスの型定義
interface HomeContainerProps {
  user: any;
  userHobby: string;
  streak: number;
  dailyMissions: { studyCount: number };
  dailyGoal: number;
  setActiveTab: (tab: string) => void;
  quickQuizStatus: 'idle' | 'correct' | 'wrong';
  generateQuickQuiz: () => void;
  cards: any[];
  quickQuizCard: any;
  quickQuizOptions: string[];
  selectedOption: string | null;
  setSelectedOption: (option: string) => void;
  setQuickQuizStatus: (status: 'idle' | 'correct' | 'wrong') => void;
  speak?: (text: string) => void;
  setSelectedCategory: (category: string) => void;
  PRESET_DECKS: any[];
  setCards: (cards: any[]) => void;
  setCurrentIndex: (index: number) => void;
  isDark: boolean;
}

export default function HomeContainer({
  user,
  userHobby,
  streak,
  dailyMissions,
  dailyGoal,
  setActiveTab,
  quickQuizStatus,
  generateQuickQuiz,
  cards,
  quickQuizCard,
  quickQuizOptions,
  selectedOption,
  setSelectedOption,
  setQuickQuizStatus,
  speak,
  setSelectedCategory,
  PRESET_DECKS,
  setCards,
  setCurrentIndex,
  isDark
}: HomeContainerProps) {

  // デザイン用クラス変数
  const subContainerClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/30 rounded-3xl';
  const innerBoxClass = isDark ? 'bg-slate-900/60 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/50 shadow-xs';
  const progressPercent = Math.min(100, Math.round((dailyMissions.studyCount / dailyGoal) * 100));

  return (
    <main className="flex-grow flex flex-col p-6 max-w-4xl w-full mx-auto relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* 🌟 ウェルカムヘッダー */}
      <section className="pt-2 pb-4 border-b border-slate-200/50 dark:border-slate-800">
        <h2 className="text-[22px] font-black tracking-tight text-slate-800 dark:text-slate-100">
          Welcome back, {user?.displayName || "Guest"}.
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1.5 tracking-wide">
          Current Focus: <span className="text-blue-500 font-bold">{userHobby || "Not Set"}</span>
        </p>
      </section>

      {/* 📊 統計ウィジェット */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Streak Record */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between h-[120px] ${subContainerClass}`}>
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Streak
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-4xl font-black text-amber-500 tracking-tighter">{streak}</span>
            <span className="text-[11px] font-bold text-slate-400">days</span>
          </div>
        </div>

        {/* Today's Goal */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between h-[120px] ${subContainerClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Daily Goal
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {dailyMissions.studyCount} / {dailyGoal}
            </span>
          </div>
          
          <div className="mt-auto space-y-3">
            <span className="text-4xl font-black text-emerald-500 tracking-tighter">{progressPercent}%</span>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ⚡ アクションボタン */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab('study')}
          className="p-4 rounded-xl bg-slate-800 text-white font-bold text-xs tracking-wide shadow-md hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
        >
          Start Review
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`p-4 rounded-xl border font-bold text-xs tracking-wide hover:bg-slate-50 transition-all flex items-center justify-center gap-2 ${
            isDark ? 'border-slate-700 bg-slate-900 text-slate-300' : 'border-slate-200 bg-white text-slate-600 shadow-xs'
          }`}
        >
          Manage Cards
        </button>
      </div>

      {/* 🎯 デイリークイッククイズ */}
      <section className={`p-6 rounded-3xl border ${subContainerClass}`}>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Quick Quiz
          </div>
          {quickQuizStatus !== 'idle' && (
            <button onClick={generateQuickQuiz} className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors">
              Next →
            </button>
          )}
        </div>

        {cards.length < 4 ? (
          <div className="py-6 text-center text-xs font-medium text-slate-400">
            Requires at least 4 cards to start.
          </div>
        ) : quickQuizCard && (
          <div className="space-y-4 max-w-sm mx-auto w-full">
            <div className="text-center py-4">
               <span className={`text-[10px] font-bold tracking-widest uppercase mb-2 block ${
                 quickQuizStatus === 'correct' ? 'text-emerald-500' : 
                 quickQuizStatus === 'wrong' ? 'text-rose-500' : 'text-slate-400'
               }`}>
                 {quickQuizStatus === 'correct' ? 'Correct' : quickQuizStatus === 'wrong' ? 'Incorrect' : 'What does this mean?'}
               </span>
               <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                 {quickQuizCard.front}
               </h3>
            </div>

            <div className="flex flex-col gap-2">
              {quickQuizOptions.map((option, idx) => {
                const isCorrectOption = option === quickQuizCard.back;
                const isSelected = selectedOption === option;

                let btnStyle = innerBoxClass;
                if (quickQuizStatus !== 'idle') {
                  if (isCorrectOption) btnStyle = "bg-emerald-50/70 border-emerald-300 text-emerald-600 font-bold shadow-xs";
                  else if (isSelected) btnStyle = "bg-rose-50/70 border-rose-300 text-rose-600 font-bold shadow-xs";
                  else btnStyle = "opacity-30 border-transparent bg-transparent text-slate-400 pointer-events-none";
                }

                return (
                  <button
                    key={idx}
                    disabled={quickQuizStatus !== 'idle'}
                    onClick={() => {
                      setSelectedOption(option);
                      if (option === quickQuizCard.back) {
                        setQuickQuizStatus('correct');
                        if (speak) speak('Excellent!');
                      } else {
                        setQuickQuizStatus('wrong');
                        if (speak) speak('Wrong answer');
                      }
                    }}
                    className={`w-full py-3 px-4 rounded-xl border text-center text-[11px] font-bold tracking-tight transition-all duration-150 ${btnStyle}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ⚠️ 要復習セクション */}
      <section className={`p-6 rounded-3xl border ${subContainerClass}`}>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Needs Review
          </div>
          <span className="text-[9px] font-mono font-bold text-rose-500 bg-rose-50/80 dark:bg-rose-500/10 px-2 py-0.5 rounded">
            {cards.filter(c => c.interval <= 1 || c.repetition === 0).length} CARDS
          </span>
        </div>

        {cards.filter(c => c.interval <= 1 || c.repetition === 0).length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {cards.filter(c => c.interval <= 1 || c.repetition === 0).slice(0, 3).map((card, idx) => (
                <div key={idx} className={`p-3 rounded-xl border text-center ${innerBoxClass}`}>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{card.front}</div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">{card.back}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setActiveTab('study');
              }}
              className="w-full py-2.5 bg-rose-50/70 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl text-[11px] font-bold tracking-wide transition shadow-xs"
            >
              Review Now
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-[11px] font-bold text-emerald-500 tracking-wide">All caught up!</p>
            <p className="text-[10px] text-slate-400 mt-1">No cards need immediate review.</p>
          </div>
        )}
      </section>
      
    </main>
  );
}