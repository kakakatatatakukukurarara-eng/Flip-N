import React from 'react';

interface CardLike {
  id: number;
  front: string;
  back: string;
  example?: string | null;
  category?: string;
  interval?: number;
  repetition?: number;
  is_public?: boolean;
}

interface HomeTabContentProps {
  user: any;
  userHobby: string;
  streak: number;
  dailyGoal: number;
  dailyMissions: {
    studyCount: number;
    testCompleted: boolean;
    speakCompleted: boolean;
  };
  cards: CardLike[];
  subContainerClass: string;
  innerBoxClass: string;
  setActiveTab: (tab: any) => void;
  setSelectedCategory: (value: string) => void;
  quickQuizCard: any;
  quickQuizStatus: 'idle' | 'correct' | 'wrong';
  quickQuizOptions: string[];
  selectedOption: string | null;
  setSelectedOption: (option: string | null) => void;
  generateQuickQuiz: () => void;
  speak: (text: string) => void;
  setQuickQuizStatus: (status: 'idle' | 'correct' | 'wrong') => void;
  PRESET_DECKS: any[];
  setCards: (cards: any[]) => void;
  setCurrentIndex: (index: number) => void;
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
}: HomeTabContentProps) {
  return (
    <main className="flex-grow flex flex-col p-4 sm:p-6 max-w-4xl w-full mx-auto relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="py-4">
        <h2 className="text-2xl font-black tracking-tight">
          おかえりなさい、{user?.displayName || 'ゲスト'}さん
        </h2>
        <p className="text-[11px] text-slate-400 font-medium mt-1">
          現在のマイブーム: <span className="text-purple-400 font-bold">{userHobby || '未設定'}</span>
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between h-32 ${subContainerClass}`}>
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> STREAK RECORD
          </div>
          <div className="flex items-end gap-1.5 my-2">
            <span className="text-4xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">{streak}</span>
            <span className="text-xs font-bold text-slate-400 pb-1">Days Continuous</span>
          </div>
          <p className="text-[9px] font-mono text-slate-500">Keep up the great rhythm!</p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between h-32 ${subContainerClass}`}>
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> TODAY'S GOAL PROGRESS
          </div>
          <div className="flex justify-between items-end my-1">
            <span className="text-4xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {Math.min(100, Math.round((dailyMissions.studyCount / dailyGoal) * 100))}%
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              {dailyMissions.studyCount} / {dailyGoal} WORDS
            </span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden border border-transparent ${innerBoxClass}`}>
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((dailyMissions.studyCount / dailyGoal) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab('study')}
          className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-mono font-bold text-xs tracking-wider shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase"
        >
          <span>🚀 Start Daily Review</span>
        </button>

        <button
          onClick={() => setActiveTab('manage')}
          className={`p-4 rounded-xl border font-mono font-bold text-xs tracking-wider hover:bg-slate-800/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase ${subContainerClass}`}
        >
          <span>✨ Create & Generate Cards</span>
        </button>
      </div>

      <section className={`p-5 rounded-2xl border ${subContainerClass}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> DAILY QUICK QUIZ
          </div>
          {quickQuizStatus !== 'idle' && (
            <button onClick={generateQuickQuiz} className="text-[9px] font-mono font-bold text-blue-400 hover:underline">NEXT QUESTION →</button>
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
                    className={`p-2.5 rounded-xl border text-[11px] font-medium text-left transition-all active:scale-[0.98] ${btnClass}`}
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
            {cards.filter((c) => c.interval! <= 1 || c.repetition === 0).length} CARDS
          </span>
        </div>

        {cards.filter((c) => c.interval! <= 1 || c.repetition === 0).length > 0 ? (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-400">
              最近 「AGAIN」 を選んだ単語、または記憶が薄れている単語があります。忘れる前に復習しましょう！
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {cards.filter((c) => c.interval! <= 1 || c.repetition === 0).slice(0, 3).map((card, idx) => (
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
                    deck.cards.forEach((presetCard: any) => {
                      if (!updatedCards.some((c: any) => c.front.toLowerCase() === presetCard.front.toLowerCase())) {
                        updatedCards.push({
                          ...presetCard,
                          id: cards.length > 0 ? Math.max(...cards.map((c: any) => c.id)) + 1 + Math.floor(Math.random() * 1000) : Math.floor(Math.random() * 1000),
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

                    alert(`「${deck.title}」を単語帳に追加しました！さっそく学習を始めましょう！`);
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-mono font-bold text-[11px] tracking-wide rounded-xl border border-slate-800 transition active:scale-[0.98]"
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
