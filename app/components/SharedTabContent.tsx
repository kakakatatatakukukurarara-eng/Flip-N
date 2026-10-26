import React, { useState, useSyncExternalStore } from 'react';
import type { Card, User } from '../types';
import { getDateDifferenceInDays, getLocalDateString } from '../lib/studyGame';

function subscribeToChallenge(listener: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  window.addEventListener('storage', listener);
  window.addEventListener('flipn-challenge-updated', listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener('flipn-challenge-updated', listener);
  };
}

function getChallengeStartDate(key: string) {
  try {
    const savedDate = window.localStorage.getItem(key);
    return savedDate && /^\d{4}-\d{2}-\d{2}$/.test(savedDate) ? savedDate : null;
  } catch {
    return null;
  }
}

type SharedCard = Card;

interface SharedTabContentProps {
  user: User | null;
  sharedCards: SharedCard[];
  studyLogs: Record<string, number>;
  subContainerClass: string;
  cardClass: string;
  isDark: boolean;
  handleImportCard: (card: Card) => void | Promise<void>;
  setActiveTab: (tab: 'home' | 'study' | 'test' | 'manage' | 'shared' | 'dashboard') => void;
}

export default function SharedTabContent({
  user,
  sharedCards,
  studyLogs,
  subContainerClass,
  cardClass,
  isDark,
  handleImportCard,
  setActiveTab,
}: SharedTabContentProps) {
  const [challengeNotice, setChallengeNotice] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const challengeGoal = 50;
  const challengeKey = `flipn_challenge_start_${user?.id ?? 'guest'}`;
  const today = getLocalDateString();
  const challengeStartDate = useSyncExternalStore(
    subscribeToChallenge,
    () => getChallengeStartDate(challengeKey),
    () => null,
  );

  const challengeDaysElapsed = challengeStartDate ? getDateDifferenceInDays(challengeStartDate, today) : 0;
  const challengeBaseline = challengeStartDate
    ? Number.parseInt(window.localStorage.getItem(`${challengeKey}_baseline`) || '0', 10)
    : 0;
  const challengeStudyCount = challengeStartDate
    ? Object.entries(studyLogs).reduce((total, [date, count]) => (
        date > challengeStartDate && date <= today
          ? total + count
          : date === challengeStartDate
            ? total + Math.max(0, count - challengeBaseline)
            : total
      ), 0)
    : 0;
  const challengeComplete = challengeStudyCount >= challengeGoal;
  const challengeExpired = challengeStartDate !== null && challengeDaysElapsed >= 7 && !challengeComplete;
  const challengeProgress = Math.min(100, Math.round((challengeStudyCount / challengeGoal) * 100));
  const challengeDaysLeft = Math.max(0, 7 - challengeDaysElapsed);

  function joinChallenge() {
    try {
      window.localStorage.setItem(challengeKey, today);
      window.localStorage.setItem(`${challengeKey}_baseline`, String(studyLogs[today] || 0));
    } catch {
      setChallengeNotice('この端末では保存できませんでした。');
      return;
    }
    window.dispatchEvent(new Event('flipn-challenge-updated'));
    setChallengeNotice('');
    setShareMessage('');
  }

  async function shareChallenge() {
    const message = `FLIP-Nの7日間チャレンジに参加中！${challengeStudyCount}/${challengeGoal}枚学習しました。`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'FLIP-N 学習チャレンジ', text: message });
      } else {
        await navigator.clipboard.writeText(message);
        setShareMessage('進捗をクリップボードにコピーしました。');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setShareMessage('共有できませんでした。ブラウザーの共有権限を確認してください。');
    }
  }

  return (
    <main className="flex-grow min-w-0 p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-4 relative z-10">
      <div className="px-1">
        <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400">共有</p>
        <h3 className="mt-1 text-2xl font-black tracking-tight">みんなの共有カード</h3>
        <p className="text-sm text-slate-500 mt-1">公開カードを自分の単語帳に追加できます。</p>
      </div>

      <section className={`overflow-hidden rounded-[24px] border bg-gradient-to-br from-amber-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/40 ${subContainerClass}`}>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">自分のペースで挑戦</p>
            </div>
            <span className="rounded-full border border-cyan-700/20 bg-white/70 px-3 py-1 text-xs font-bold text-cyan-800 dark:border-cyan-300/20 dark:bg-slate-800 dark:text-cyan-200">
              {challengeComplete ? '達成' : challengeExpired ? '期間終了' : challengeStartDate ? '参加中' : '未参加'}
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {challengeComplete
              ? '目標達成です。学習の積み重ねをシェアしましょう。'
              : challengeExpired
                ? '期間が終了しました。いつでも再挑戦できます。'
                : challengeStartDate
                  ? `今日を含めてあと${challengeDaysLeft}日。学習したカード数が自動で記録されます。`
                  : '参加すると、これから学習したカードを7日間記録します。'}
          </p>

          {challengeStartDate && !challengeExpired && (
            <div className="mt-5">
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                <p className="text-xs font-bold text-slate-500">現在の進捗</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  <span className="mr-1 text-3xl font-black tabular-nums text-cyan-700 dark:text-cyan-300">{Math.min(challengeStudyCount, challengeGoal)}</span>
                  / {challengeGoal} 枚
                </p>
              </div>
              <div
                className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                role="progressbar"
                aria-label="チャレンジの進捗"
                aria-valuenow={Math.min(challengeStudyCount, challengeGoal)}
                aria-valuemin={0}
                aria-valuemax={challengeGoal}
              >
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-emerald-400 transition-all duration-500" style={{ width: `${challengeProgress}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{challengeComplete ? '7日間チャレンジ達成！' : `残り ${Math.max(0, challengeGoal - challengeStudyCount)} 枚`}</p>
            </div>
          )}

          {challengeNotice && <p role="status" className="mt-3 text-xs text-amber-600">{challengeNotice}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {!challengeStartDate || challengeExpired ? (
              <button onClick={joinChallenge} className="min-h-11 rounded-xl bg-cyan-800 px-5 text-sm font-bold text-white transition hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500">
                {challengeExpired ? 'もう一度挑戦する' : 'チャレンジに参加する'}
              </button>
            ) : (
              <>
                {!challengeComplete && (
                  <button onClick={() => setActiveTab('study')} className="min-h-11 rounded-xl bg-cyan-800 px-5 text-sm font-bold text-white transition hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500">
                    学習を続ける
                  </button>
                )}
                <button onClick={shareChallenge} className={`min-h-11 rounded-xl border px-4 text-sm font-bold transition ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-white'}`}>
                  進捗をシェア
                </button>
              </>
            )}
          </div>
        </div>
        {shareMessage && <p role="status" className="border-t border-slate-200/70 px-5 py-3 text-xs text-slate-600 dark:border-slate-700/70 dark:text-slate-300">{shareMessage}</p>}
      </section>

      {!user ? (
        <div className={`w-full p-8 text-center rounded-2xl border font-mono text-[11px] tracking-wide font-bold shadow-sm ${subContainerClass}`}>
          共有カードの閲覧・インポートにはログインが必要です。
        </div>
      ) : sharedCards.length === 0 ? (
        <div className={`w-full rounded-[24px] border px-5 py-10 text-center shadow-sm ${subContainerClass}`}>
          <p className="text-base font-bold">まだ共有カードがありません</p>
          <p className="mt-2 text-sm text-slate-500">自分のカードを公開すると、ここに表示されます。</p>
          <button
            onClick={() => setActiveTab('manage')}
            className="mt-5 min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            カードを公開する
          </button>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-1">
          {sharedCards.map((sCard) => (
            <div key={sCard.id} className={`min-w-0 p-4 rounded-2xl border flex justify-between items-start gap-4 transition hover:-translate-y-0.5 shadow-sm ${cardClass}`}>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex min-w-0 items-center gap-2 flex-wrap">
                  <span className={`min-w-0 break-words text-xs font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{sCard.front}</span>
                  <span className="text-slate-600 text-[10px]">|</span>
                  <span className="min-w-0 break-words text-xs text-blue-400 font-medium">{sCard.back}</span>
                  <span className="shrink-0 text-[8px] font-mono uppercase tracking-wider text-purple-400 px-1.5 py-0.5 bg-purple-500/10 rounded border border-purple-500/20">{sCard.category || 'Shared'}</span>
                </div>
                {sCard.example && <p className="break-words text-[11px] text-slate-400 italic">{sCard.example}</p>}
              </div>
              <button
                onClick={() => handleImportCard(sCard)}
                className="min-h-10 shrink-0 rounded-xl bg-blue-700 px-3 text-xs font-bold text-white transition hover:bg-blue-600"
              >
                単語帳に追加
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
