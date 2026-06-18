import React, { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function RankingContainer({ user, cards }: { user: any, cards: any[] }) {
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [rankings, setRankings] = useState<any[]>([]);

  // リアルタイムでランキングを取得
  useEffect(() => {
    const q = query(collection(db, "rankings"), orderBy("time", "asc"), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRankings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const startBattle = () => {
    setIsBattleActive(true);
    setStartTime(Date.now());
  };

  const finishBattle = async (score: number) => {
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;
    
    // Firebaseに保存
    await addDoc(collection(db, "rankings"), {
      name: user?.displayName || "Guest",
      time: timeTaken,
      createdAt: new Date()
    });
    setIsBattleActive(false);
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