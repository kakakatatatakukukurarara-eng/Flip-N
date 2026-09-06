import React from 'react';

interface SharedTabContentProps {
  user: any;
  sharedCards: any[];
  subContainerClass: string;
  cardClass: string;
  isDark: boolean;
  handleImportCard: (card: any) => void;
}

export default function SharedTabContent({
  user,
  sharedCards,
  subContainerClass,
  cardClass,
  isDark,
  handleImportCard,
}: SharedTabContentProps) {
  return (
    <main className="flex-grow p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-4 relative z-10">
      <div className="px-1">
        <h3 className="text-sm font-black tracking-tight">🌐 全体公開フレーズマーケット</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">世界中のFLIP-Nユーザーが全体公開している有益な単語やフレーズを、自分の単語帳へワンタップでインポートできます。</p>
      </div>

      {!user ? (
        <div className={`w-full p-8 text-center rounded-2xl border font-mono text-[11px] tracking-wide font-bold ${subContainerClass}`}>
          共有カードの閲覧・インポートにはログインが必要です。
        </div>
      ) : sharedCards.length === 0 ? (
        <div className={`w-full p-12 text-center rounded-2xl border font-mono text-[11px] tracking-widest font-bold ${subContainerClass}`}>
          現在、全体公開されている共有カードはありません。
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-1">
          {sharedCards.map((sCard) => (
            <div key={sCard.id} className={`p-4 rounded-2xl border flex justify-between items-start gap-4 transition ${cardClass}`}>
              <div className="space-y-1 flex-grow">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{sCard.front}</span>
                  <span className="text-slate-600 text-[10px]">|</span>
                  <span className="text-xs text-blue-400 font-medium">{sCard.back}</span>
                  <span className="text-[8px] font-mono uppercase tracking-wider text-purple-400 px-1.5 py-0.5 bg-purple-500/10 rounded border border-purple-500/20">{sCard.category || 'Shared'}</span>
                </div>
                {sCard.example && <p className="text-[11px] text-slate-400 italic">{sCard.example}</p>}
                <div className="text-[8px] font-mono text-slate-600 pt-0.5">
                  CONTRIBUTOR // USER_ID: {sCard.user_id?.substring(0, 8)}...
                </div>
              </div>
              <button
                onClick={() => handleImportCard(sCard)}
                className="flex-shrink-0 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-[9px] tracking-wider rounded-lg transition shadow-xs uppercase flex items-center gap-1"
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
