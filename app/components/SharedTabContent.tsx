import React from 'react';
import type { Card, User } from '../types';

type SharedCard = Card;

interface SharedTabContentProps {
  user: User | null;
  streak: number;
  sharedCards: SharedCard[];
  subContainerClass: string;
  cardClass: string;
  isDark: boolean;
  handleImportCard: (card: Card) => void | Promise<void>;
}

export default function SharedTabContent({
  user,
  streak,
  sharedCards,
  subContainerClass,
  cardClass,
  isDark,
  handleImportCard,
}: SharedTabContentProps) {
  const communityChallenges = [
    {
      title: '7日連続学習チャレンジ',
      description: '毎日1回以上学習して、連続記録を伸ばしましょう。',
      progress: Math.min(100, Math.round((Math.min(streak, 7) / 7) * 100)),
      accent: 'from-orange-500 to-amber-400',
      tag: 'Hot',
    },
    {
      title: '共有カード祭り',
      description: '公開カードをインポートして、自分の単語帳をもっと充実させる。',
      progress: Math.min(100, Math.round((Math.min(sharedCards.length, 12) / 12) * 100)),
      accent: 'from-violet-500 to-purple-500',
      tag: 'Community',
    },
    {
      title: 'マスター達成月間',
      description: '習得率80%を超えると、ランキングに載ります。',
      progress: Math.min(100, Math.round((Math.min(streak * 10, 80) / 80) * 100)),
      accent: 'from-emerald-500 to-teal-500',
      tag: 'Rank',
    },
  ];

  return (
    <main className="flex-grow min-w-0 p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-4 relative z-10">
      <div className="px-1">
        <h3 className="text-sm font-black tracking-tight">🌐 全体公開フレーズマーケット</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">世界中のFLIP-Nユーザーが全体公開している有益な単語やフレーズを、自分の単語帳へワンタップでインポートできます。</p>
      </div>

      <section className={`rounded-[28px] border p-4 ${subContainerClass}`}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-violet-500">Community challenge</p>
            <h4 className="mt-1 text-lg font-black tracking-tight">みんなで伸ばす学習ランキング</h4>
          </div>
          <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-[9px] font-mono font-bold text-violet-400">
            LIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {communityChallenges.map((challenge) => (
            <div key={challenge.title} className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-violet-500">{challenge.tag}</span>
                <span className="text-[9px] font-mono font-bold text-slate-500">{challenge.progress}%</span>
              </div>
              <h5 className="mt-3 text-sm font-black tracking-tight">{challenge.title}</h5>
              <p className="mt-1 text-[10px] text-slate-400 leading-relaxed">{challenge.description}</p>
              <div className="mt-3 h-2 rounded-full bg-slate-200/70 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${challenge.accent}`} style={{ width: `${challenge.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {!user ? (
        <div className={`w-full p-8 text-center rounded-2xl border font-mono text-[11px] tracking-wide font-bold shadow-sm ${subContainerClass}`}>
          共有カードの閲覧・インポートにはログインが必要です。
        </div>
      ) : sharedCards.length === 0 ? (
        <div className={`w-full p-12 text-center rounded-2xl border font-mono text-[11px] tracking-widest font-bold shadow-sm ${subContainerClass}`}>
          現在、全体公開されている共有カードはありません。
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
                <div className="text-[8px] font-mono text-slate-600 pt-0.5">
                  CONTRIBUTOR // USER_ID: {sCard.user_id?.substring(0, 8)}...
                </div>
              </div>
              <button
                onClick={() => handleImportCard(sCard)}
                className="shrink-0 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5 text-white font-mono font-bold text-[9px] tracking-wider rounded-lg transition shadow-xs uppercase flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                IMPORT
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
