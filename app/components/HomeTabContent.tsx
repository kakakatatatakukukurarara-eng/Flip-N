import React from 'react';
import type { Card, User } from '../types';

type PresetDeckCard = Pick<Card, 'front' | 'back' | 'example' | 'category'> & { id?: number };
type PresetDeck = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  cards: PresetDeckCard[];
};

interface HomeTabContentProps {
  user: User | null;
  userHobby: string;
  streak: number;
  dailyGoal: number;
  dailyMissions: {
    studyCount: number;
    testCompleted: boolean;
    speakCompleted: boolean;
  };
  cards: Card[];
  subContainerClass: string;
  innerBoxClass: string;
  setActiveTab: (tab: 'home' | 'study' | 'test' | 'manage' | 'shared' | 'dashboard') => void;
  setSelectedCategory: (value: string) => void;
  quickQuizCard: Card | null;
  quickQuizStatus: 'idle' | 'correct' | 'wrong';
  quickQuizOptions: string[];
  selectedOption: string | null;
  setSelectedOption: (option: string | null) => void;
  generateQuickQuiz: () => void;
  speak: (text: string) => void;
  setQuickQuizStatus: (status: 'idle' | 'correct' | 'wrong') => void;
  PRESET_DECKS: PresetDeck[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  setCurrentIndex: (index: number) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function HomeTabContent({
  user,
  userHobby,
  streak,
  dailyGoal,
  dailyMissions,
  cards,
  subContainerClass,
  innerBoxClass,
  setActiveTab,
  setSelectedCategory,
  quickQuizCard,
  quickQuizStatus,
  quickQuizOptions,
  selectedOption,
  setSelectedOption,
  generateQuickQuiz,
  speak,
  setQuickQuizStatus,
  PRESET_DECKS,
  setCards,
  setCurrentIndex,
  showToast,
}: HomeTabContentProps) {
  const progressPercent = Number.isFinite(dailyGoal) && dailyGoal > 0
    ? Math.min(100, Math.max(0, Math.round((dailyMissions.studyCount / dailyGoal) * 100)))
    : 0;

  const dueCardsCount = cards.filter((card) => (card.interval ?? 1) <= 1 || card.repetition === 0).length;
  const weakCardsCount = cards.filter((card) => (card.interval ?? 1) >= 3 || (card.repetition ?? 0) <= 1).length;
  const routineTasks = [
    { label: '復習を1問進める', done: dailyMissions.studyCount >= 1 },
    { label: 'クイズに1回挑戦', done: dailyMissions.testCompleted },
    { label: '音声チェックを1回試す', done: dailyMissions.speakCompleted },
  ];
  const routineProgress = Math.round((routineTasks.filter((task) => task.done).length / routineTasks.length) * 100);

  return (
    <main className="flex-grow min-w-0 flex flex-col p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="py-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 text-[9px] font-mono font-bold tracking-[0.24em] text-blue-500 uppercase">Premium study flow</div>
        <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-[-0.06em] leading-none bg-gradient-to-r from-slate-900 via-slate-700 to-blue-600 bg-clip-text text-transparent dark:from-slate-100 dark:via-slate-200 dark:to-blue-400">
          おかえりなさい、{user?.displayName || 'ゲスト'}さん
        </h2>
        <p className="text-[11px] sm:text-[12px] text-slate-400 font-medium mt-2">
          現在のマイブーム: <span className="text-purple-400 font-bold">{userHobby || '未設定'}</span>
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-5 rounded-[28px] border flex flex-col justify-between h-36 bg-gradient-to-br from-orange-50 via-white to-amber-50/80 ${subContainerClass}`}>
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> STREAK RECORD
          </div>
          <div className="flex items-end gap-1.5 my-2">
            <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">{streak}</span>
            <span className="text-xs font-bold text-slate-400 pb-1">Days Continuous</span>
          </div>
          <p className="text-[9px] font-mono text-slate-500">Keep up the great rhythm!</p>
        </div>

        <div className={`p-5 rounded-[28px] border flex flex-col justify-between h-36 bg-gradient-to-br from-emerald-50 via-white to-teal-50/80 ${subContainerClass}`}>
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> TODAY&apos;S GOAL PROGRESS
          </div>
          <div className="flex justify-between items-end my-1">
            <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {progressPercent}%
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              {dailyMissions.studyCount} / {dailyGoal} WORDS
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden border border-transparent ${innerBoxClass}`}>
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className={`p-5 rounded-[28px] border ${subContainerClass}`}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[9px] font-mono font-bold tracking-[0.24em] uppercase text-blue-500">Daily mini habit</p>
            <h3 className="mt-2 text-xl font-black tracking-tight">今日のルーティン</h3>
          </div>
          <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-mono font-bold text-blue-600">
            {routineProgress}%
          </div>
        </div>

        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500" style={{ width: `${routineProgress}%` }} />
        </div>

        <p className="mb-3 text-[10px] font-mono text-slate-500">
          苦手カード優先: <span className="font-bold text-slate-700">{weakCardsCount} 枚</span> / 復習待ち: <span className="font-bold text-slate-700">{dueCardsCount} 枚</span>
        </p>

        <div className="space-y-2.5">
          {routineTasks.map((task) => (
            <button
              key={task.label}
              onClick={() => setActiveTab(task.label.includes('クイズ') ? 'test' : task.label.includes('音声') ? 'study' : 'study')}
              className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition ${task.done ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500' : 'border-slate-200/80 bg-slate-50/60 text-slate-700'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{task.done ? '✅' : '⚡'}</span>
                <span className="text-[11px] font-bold">{task.label}</span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase">{task.done ? 'Done' : 'Go'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab('study')}
          className="min-h-[56px] p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-mono font-bold text-xs tracking-wider shadow-lg shadow-blue-500/20 hover:opacity-95 hover:-translate-y-0.5 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase"
        >
          <span>🚀 Start Daily Review</span>
        </button>

        <button
          onClick={() => setActiveTab('manage')}
          className={`min-h-[56px] p-4 rounded-2xl border font-mono font-bold text-xs tracking-wider hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase ${subContainerClass}`}
        >
          <span>✨ Create &amp; Generate Cards</span>
        </button>
      </div>

      {dueCardsCount > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-amber-400">Review needed</p>
              <p className="mt-1 text-sm font-bold break-words">{cards.filter((card) => (card.interval ?? 1) <= 1 || card.repetition === 0).length}枚のカードが復習待ちです</p>
            </div>
            <button
              onClick={() => setActiveTab('study')}
              className="shrink-0 rounded-xl bg-amber-500 px-3 py-2 text-[10px] font-mono font-bold text-slate-950 transition hover:bg-amber-400 hover:-translate-y-0.5"
            >
              今すぐ開く
            </button>
          </div>
        </div>
      )}

      <section className={`p-5 rounded-[28px] border bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-cyan-500/[0.04] ${subContainerClass}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> DAILY QUICK QUIZ
          </div>
          {quickQuizStatus !== 'idle' && (
            <button onClick={generateQuickQuiz} className="text-[9px] font-mono font-bold text-blue-400 hover:text-blue-300 hover:underline transition">NEXT QUESTION →</button>
          )}
        </div>

        {cards.length < 4 ? (
          <div className="py-4 text-center">
            <p className="text-[10px] text-slate-500 font-mono">クイズを開始するには単語を4枚以上登録してください</p>
          </div>
        ) : quickQuizCard && (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border font-mono text-center transition-all ${innerBoxClass} ${quickQuizStatus === 'correct' ? 'border-green-500/50 bg-green-500/5' : quickQuizStatus === 'wrong' ? 'border-red-500/50 bg-red-500/5' : ''}`}>
              <span className="text-[9px] text-slate-500 block mb-1">
                {quickQuizStatus === 'correct' ? '✨ CORRECT!' : quickQuizStatus === 'wrong' ? '❌ OOPS!' : '次の単語の正しい意味は？'}
              </span>
              <span className="text-sm font-black text-slate-800 tracking-wide uppercase">
                {quickQuizCard.front}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickQuizOptions.map((option, idx) => {
                const isCorrectOption = option === quickQuizCard.back;
                const isSelected = selectedOption === option;

                let btnClass = innerBoxClass;
                if (quickQuizStatus !== 'idle') {
                  if (isCorrectOption) btnClass = 'border-green-500 bg-green-500/20 text-green-400 font-bold';
                  else if (isSelected) btnClass = 'border-red-500 bg-red-500/20 text-red-400';
                  else btnClass = 'opacity-40 border-slate-800';
                }

                return (
                  <button
                    key={idx}
                    disabled={quickQuizStatus !== 'idle'}
                    onClick={() => {
                      setSelectedOption(option);
                      if (option === quickQuizCard.back) {
                        setQuickQuizStatus('correct');
                        speak('Excellent!');
                      } else {
                        setQuickQuizStatus('wrong');
                        speak('Wrong answer');
                      }
                    }}
                    className={`min-h-[52px] p-2.5 rounded-xl border text-[11px] font-medium text-left transition-all active:scale-[0.98] ${btnClass}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="truncate">{option}</span>
                      {quickQuizStatus !== 'idle' && isCorrectOption && <span>check</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {quickQuizStatus !== 'idle' && quickQuizCard.example && (
              <p className="text-[10px] text-slate-500 italic text-center animate-in fade-in duration-500">
                Example: {quickQuizCard.example}
              </p>
            )}
          </div>
        )}
      </section>

      <section className={`p-5 rounded-2xl border ${subContainerClass}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> NEEDS REVIEW
          </div>
          <span className="text-[9px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md">
            {cards.filter((c) => (c.interval ?? 1) <= 1 || c.repetition === 0).length} CARDS
          </span>
        </div>

        {cards.filter((c) => (c.interval ?? 1) <= 1 || c.repetition === 0).length > 0 ? (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-400">
              最近 「AGAIN」 を選んだ単語、または記憶が薄れている単語があります。忘れる前に復習しましょう！
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {cards.filter((c) => (c.interval ?? 1) <= 1 || c.repetition === 0).slice(0, 3).map((card, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl border text-center font-mono ${innerBoxClass}`}>
                  <div className="text-xs font-bold text-slate-800 truncate">{card.front}</div>
                  <div className="text-[9px] text-slate-500 truncate mt-0.5">{card.back}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedCategory('All');
                setActiveTab('study');
              }}
              className="w-full mt-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-mono font-bold tracking-wider transition flex items-center justify-center gap-2 uppercase"
            >
              <span>🎯 苦手な単語を今すぐ集中復習</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <span className="text-xl block mb-1">🎉</span>
            <p className="text-[11px] font-mono text-emerald-400 font-bold">ALL CARDS ARE UP TO DATE! PERFECT!</p>
            <p className="text-[10px] text-slate-500 mt-0.5">現在、復習が必要な単語はありません。素晴らしい記憶力です！</p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider text-blue-400 px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> RECOMMENDED STARTER DECKS
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_DECKS.map((deck) => (
            <div key={deck.id} className={`p-5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all hover:scale-[1.01] ${subContainerClass}`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{deck.icon}</span>
                  <span className="text-[9px] font-mono font-bold tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                    {deck.cards.length} WORDS
                  </span>
                </div>
                <h4 className="text-sm font-black tracking-tight text-slate-800">{deck.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{deck.description}</p>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => {
                    const updatedCards = [...cards];
                    deck.cards.forEach((presetCard) => {
                      const cardAlreadyExists = updatedCards.some((c) => c.front.toLowerCase() === presetCard.front?.toLowerCase());
                      if (!cardAlreadyExists && presetCard.front) {
                        updatedCards.push({
                          ...presetCard,
                          id: cards.length > 0 ? Math.max(...cards.map((c) => c.id)) + 1 + Math.floor(Math.random() * 1000) : Math.floor(Math.random() * 1000),
                          interval: 1,
                          repetition: 0,
                          efactor: 2.5,
                          next_review_at: new Date().toISOString(),
                          is_public: false,
                        });
                      }
                    });

                    setCards(updatedCards);
                    setSelectedCategory(deck.category);
                    setActiveTab('study');
                    setCurrentIndex(0);

                    showToast?.(`「${deck.title}」を単語帳に追加しました。さっそく学習を始めましょう！`, 'success');
                  }}
                  className="min-h-[52px] w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-mono font-bold text-[11px] tracking-wide rounded-xl border border-slate-800 transition active:scale-[0.98]"
                >
                  📥 このパックを追加してすぐ学習する
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
