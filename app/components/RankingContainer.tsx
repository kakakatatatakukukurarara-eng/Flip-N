import React, { useState, useEffect } from 'react';

export default function RankingContainer({ user, cards }: { user: any, cards: any[] }) {
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [rankings, setRankings] = useState<any[]>([]);

  useEffect(() => {
    setRankings([
      { id: '1', name: 'Demo User', time: 12.34 },
      { id: '2', name: 'Top Player', time: 15.67 },
    ]);
  }, []);

  const startBattle = () => {
    setIsBattleActive(true);
    setStartTime(Date.now());
  };

  const finishBattle = async (score: number) => {
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;
    setIsBattleActive(false);

    console.log('Battle finished:', { score, timeTaken });
  };

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-8">
      {!isBattleActive ? (
        <>
          <div className="text-center">
            <h2 className="text-2xl font-black">🔥 クイズバトル</h2>
            <button onClick={startBattle} className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold">
              バトルを開始する
            </button>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl text-white">
            <h3 className="font-bold mb-4">🏆 ランキング TOP 10</h3>
            {rankings.map((r, i) => (
              <div key={r.id} className="flex justify-between py-2 border-b border-slate-700">
                <span>{i + 1}位: {r.name}</span>
                <span className="font-mono">{r.time.toFixed(2)}秒</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        // ここにクイズロジックを入れる（既存のquickQuizのコードを移植）
        <div className="text-center">
          <p className="text-xl font-bold">バトル中！</p>
          {/* 問題の表示と回答ボタン。最後に finishBattle() を呼ぶ */}
        </div>
      )}
    </main>
  );
}