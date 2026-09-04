"use client";

import type { Card } from '../types';

export interface CardExplanation {
  nuance: string;
  usage: string;
  similar: string;
  mistakes: string;
  pronunciation: string;
  example: string;
  exampleJp: string;
  quiz: string;
  quizAnswer: string;
}

interface CardExplainModalProps {
  card: Card;
  explanation: CardExplanation | null;
  isLoading: boolean;
  isDark: boolean;
  onClose: () => void;
}

export default function CardExplainModal({ card, explanation, isLoading, isDark, onClose }: CardExplainModalProps) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${card.front}のAI解説`}>
      <div className={`flex max-h-[min(44rem,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border shadow-2xl ${isDark ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`}>
        <header className="flex items-start justify-between border-b border-slate-800/70 px-6 py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-mono font-bold tracking-[0.18em] text-blue-500 uppercase">AI deep dive</p>
            <h2 className="mt-1 truncate text-2xl font-black">{card.front}</h2>
            <p className="mt-1 text-sm text-blue-400">{card.back}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="閉じる" className="ml-4 rounded-xl border border-slate-700 px-3 py-2 text-slate-400 transition hover:border-slate-500 hover:text-white">×</button>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-sm text-slate-400">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
              AIがこの単語を分析しています...
            </div>
          ) : explanation ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:col-span-2"><h3 className="text-[10px] font-mono font-bold tracking-wider text-blue-400 uppercase">重要ポイント</h3><p className="mt-2 text-sm leading-7">{explanation.nuance}</p></section>
              <section className="rounded-2xl border border-slate-800 p-4"><h3 className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">背景・使われ方</h3><p className="mt-2 text-sm leading-7">{explanation.usage}</p></section>
              <section className="rounded-2xl border border-slate-800 p-4"><h3 className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">関連する知識</h3><p className="mt-2 text-sm leading-7">{explanation.similar}</p></section>
              <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"><h3 className="text-[10px] font-mono font-bold tracking-wider text-amber-400 uppercase">注意点</h3><p className="mt-2 text-sm leading-7">{explanation.mistakes}</p></section>
              <section className="rounded-2xl border border-slate-800 p-4"><h3 className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">覚えるヒント</h3><p className="mt-2 text-sm leading-7">{explanation.pronunciation}</p></section>
              <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:col-span-2"><h3 className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase">例・イメージ</h3><p className="mt-2 text-base font-bold leading-7">{explanation.example}</p><p className="mt-1 text-sm text-slate-400">{explanation.exampleJp}</p></section>
              <section className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 sm:col-span-2"><h3 className="text-[10px] font-mono font-bold tracking-wider text-purple-400 uppercase">1問チェック</h3><p className="mt-2 text-sm leading-7">{explanation.quiz}</p><p className="mt-2 text-sm font-bold text-purple-300">答え: {explanation.quizAnswer}</p></section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
