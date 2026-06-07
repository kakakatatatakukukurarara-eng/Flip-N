import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image'; // 軽量で綺麗な画像化ライブラリ

// Propsの型定義（既存のステートを引き継ぐ）
interface SharePreviewProps {
  streak: number;
  level: number;
  studyLogs: Record<string, number>;
  deckSize: number;  // 🌟 新しく使うものだけにする
  mastery: number;   // 🌟 新しく使うものだけにする
  isDark: boolean;   // 🌟 新しく使うものだけにする
  onClose: () => void;
}

export default function SharePreviewModal({
  streak,
  level,
  studyLogs = {},
  deckSize = 0, // 🌟 Propsから受け取る
  mastery = 0,  // 🌟 Propsから受け取る
  isDark = false,
  onClose
}: SharePreviewProps) {
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // 1. 画像を生成してダウンロードする関数
  const handleDownloadImage = async () => {
    if (!shareCardRef.current) return;
    setIsExporting(true);

    try {
      // html-to-imageを使ってPNG画像を生成
      const dataUrl = await toPng(shareCardRef.current, {
        quality: 0.95,
        backgroundColor: isDark ? '#0f172a' : '#ffffff', // 背景色を固定
      });

      // ダウンロード用のElementを作成して発火
      const link = document.createElement('a');
      link.download = `FLIP-N_Streak_${streak}Days.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('画像の生成に失敗しました:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[9999]">
      <div className="w-full max-w-sm flex flex-col gap-4">

        {/* 🌟 撮影対象となる隠れコンポーネント（SNSサイズに最適化） */}
        <div
          ref={shareCardRef}
          className={`p-6 rounded-3xl border shadow-2xl flex flex-col justify-between aspect-[4/5] w-full ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
        >
          {/* ヘッダー */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-black tracking-wider">
              FLIP-N <span className="text-blue-500">PRO</span>
            </span>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400">
              LEARNING REPORT
            </span>
          </div>

          {/* メイン実績（ストリーク） */}
          <div className="text-center my-auto space-y-2">
            <span className="text-5xl block animate-bounce">🔥</span>
            <h1 className="text-4xl font-black tracking-tighter font-mono">{streak} DAYS</h1>
            <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">CURRENT STREAK</p>
          </div>

          {/* サブステータス */}
          <div className="grid grid-cols-3 gap-2 border-t border-b py-3 my-2 border-slate-800/50 font-mono text-center">
            <div>
              <span className="text-[9px] text-slate-500 block">LEVEL</span>
              <span className="text-xs font-bold text-purple-400">LV.{level}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">DECK SIZE</span>
              <span className="text-xs font-bold">{deckSize}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">MASTERY</span>
              <span className="text-xs font-bold text-green-400">{mastery}%</span>
            </div>
          </div>

          {/* ミニ・ヒートマップ（直近4週間分のみをコンパクトに表示） */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider block">RECENT ACTIVITY</span>
            <div className="flex gap-1 justify-center">
              {Array.from({ length: 28 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (27 - i));
                const dateStr = d.toISOString().split('T')[0];
                const count = studyLogs[dateStr] || 0;

                let bgClass = isDark ? 'bg-slate-800' : 'bg-slate-100';
                if (count > 0 && count <= 3) bgClass = 'bg-emerald-500/30';
                if (count > 3 && count <= 10) bgClass = 'bg-emerald-500/60';
                if (count > 10) bgClass = 'bg-emerald-500';

                return <div key={i} className={`w-2.5 h-2.5 rounded-xs ${bgClass}`} />;
              })}
            </div>
          </div>

          {/* フッター（QRコードなどの導線用） */}
          <div className="text-center pt-4 text-[8px] font-mono text-slate-500 tracking-widest">
            JOIN THE LEVEL UP // FLIP-N.COM
          </div>
        </div>

        {/* 🕹️ 操作コントロールボタン */}
        <div className="flex gap-2 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 font-mono font-bold text-xs rounded-xl border border-slate-700 transition"
          >
            CLOSE
          </button>
          <button
            onClick={() => {
              // 1. シェアしたいテキストを作成（改行は \n）
              const text = `FLIP-N PRO で学習記録を達成しました！🔥\n\n📊 今日の成果\n・連続学習: {streak}日\n・現在のレベル: Lv.{level}\n・定着率: {mastery}%\n\n#FLIP_N_PRO #今日の積み上げ`;

              // 2. URLエンコードする（文字化け対策）
              const encodedText = encodeURIComponent(text);

              // 3. Xのシェア用URLを作成して新しいタブで開く
              const xUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
              window.open(xUrl, '_blank', 'noreferrer');
            }}
            className="flex-1 py-3 bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
          >
            𝕏 SHARE ON X
          </button>
          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded-xl transition shadow-lg shadow-blue-600/20 uppercase"
          >
            {isExporting ? 'GENERATING...' : '💾 DOWNLOAD'}
          </button>
        </div>

      </div>
    </div>
  );
}