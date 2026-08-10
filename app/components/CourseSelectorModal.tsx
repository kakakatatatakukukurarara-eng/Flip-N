import React from 'react';

interface CourseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourse: (courseType: 'daily' | 'business') => void;
  subContainerClass: string;
  cardClass: string;
}

export default function CourseSelectorModal({
  isOpen,
  onClose,
  onSelectCourse,
  subContainerClass,
  cardClass,
}: CourseSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className={`p-6 rounded-2xl border max-w-md w-full ${subContainerClass}`}>
        <div className="text-center mb-6">
          <span className="text-xs font-mono font-bold text-blue-500 tracking-widest uppercase block mb-1">Welcome to FLIP-N</span>
          <h3 className="text-base font-black tracking-tight">初期プリセットを選択してください</h3>
          <p className="text-[11px] text-slate-400 mt-1">いつでもカードの追加・削除・編集が可能です。</p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => onSelectCourse('daily')} className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.01] ${cardClass} hover:border-blue-500/50 group`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold tracking-wide group-hover:text-blue-400 transition">日常英会話コース</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-sm font-bold border border-blue-500/20">DAILY</span>
            </div>
            <p className="text-[11px] text-slate-400">&quot;It&apos;s up to you&quot; や &quot;Make sense?&quot; など、明日からすぐに使えるリアルな日常フレーズを集めた初心者向けパック。</p>
          </button>
          <button onClick={() => onSelectCourse('business')} className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.01] ${cardClass} hover:border-purple-500/50 group`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold tracking-wide group-hover:text-purple-400 transition">ビジネス英語コース</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-sm font-bold border border-purple-500/20">BUSINESS</span>
            </div>
            <p className="text-[11px] text-slate-400">&quot;ASAP&quot; などの頻出略語から、&quot;Align(すり合わせる)&quot; といったミーティングや現場で必須となるプロ向け実践パック。</p>
          </button>
        </div>
        <button onClick={onClose} className="mt-4 w-full text-center text-[10px] font-mono text-slate-500 hover:text-slate-300 py-1">スキップして空の単語帳を作る</button>
      </div>
    </div>
  );
}
