"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Card {
  id: number;
  front: string;
  back: string;
  example: string | null;
  category: string;
  interval: number;
  next_review_at: string;
}

export default function UltimateStudyExperience() {
  const [cards, setCards] = useState<Card[]>([]);
  const [displayCards, setDisplayCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'study' | 'test' | 'manage' | 'dashboard'>('study');

  // 🏆 ゲーミフィケーション
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [title, setTitle] = useState('単語ビギナー');

  // 🔊 音声分析
  const [isRecording, setIsRecording] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);

  // 🔄 360度インタラクティブ回転用のMotionValue
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]); // 上下30度
  const rotateY = useTransform(x, [-100, 100], [-30, 30]); // 左右30度

  // カード管理、クイズ、その他状態（前回のコードを継承）
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // データを読み込む
  async function fetchCards() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('cards')
        .select('*')
        .order('next_review_at', { ascending: true });
      if (data) setCards(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ログイン・進捗計算（ストリーク・レベル）
  useEffect(() => {
    fetchCards();
    // ストリーク
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem('last_login_date');
    const currentStreak = parseInt(localStorage.getItem('streak_count') || '0', 10);
    if (lastLogin === today) {
      setStreak(currentStreak === 0 ? 1 : currentStreak);
    } else if (lastLogin === new Date(Date.now() - 86400000).toDateString()) {
      const newStreak = currentStreak + 1;
      localStorage.setItem('streak_count', newStreak.toString());
      localStorage.setItem('last_login_date', today);
      setStreak(newStreak);
    } else {
      localStorage.setItem('streak_count', '1');
      localStorage.setItem('last_login_date', today);
      setStreak(1);
    }
  }, []);

  // レベルと称号を計算
  useEffect(() => {
    const totalMastered = cards.filter(c => c.interval > 1).length;
    const newLevel = Math.floor(totalMastered / 5) + 1;
    setLevel(newLevel);
    if (newLevel >= 10) setTitle('単語マスター🏆');
    else if (newLevel >= 5) setTitle('単語エキスパート');
    else if (newLevel >= 3) setTitle('単語アドバイザー');
    else setTitle('単語ビギナー');
  }, [cards]);

  // フィルター・検索
  useEffect(() => {
    let result = cards.filter(card => {
      const matchesCategory = selectedCategory === 'All' || card.category === selectedCategory;
      const matchesSearch = card.front.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            card.back.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    setDisplayCards(result);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards, selectedCategory, searchQuery]);

  // 音声読み上げ
  function speak(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = /^[A-Za-z0-9\s,.:?!'"-]+$/.test(text) ? 'en-US' : 'ja-JP';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  // AI音声分析（モック）
  function startPronunciationAnalysis() {
    if (!('webkitSpeechRecognition' in window)) {
      alert('このブラウザは音声認識に対応していません。Chromeをお使いください。');
      return;
    }
    setIsRecording(true);
    setPronunciationScore(null);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      const targetWord = displayCards[currentIndex].front;
      // 簡易的な判定ロジック（モック）
      if (speechToText.toLowerCase() === targetWord.toLowerCase()) {
        const score = Math.floor(Math.random() * 10) + 90; // 90-99%
        setPronunciationScore(score);
        speak('Excellent!');
      } else {
        const score = Math.floor(Math.random() * 20) + 60; // 60-79%
        setPronunciationScore(score);
        speak('Try again.');
      }
    };

    recognition.onerror = () => { setIsRecording(false); };
    recognition.onend = () => { setIsRecording(false); };
    recognition.start();
  }

  // 復習タイミングの計算（継承）
  async function handleResponse(isCorrect: boolean) {
    const currentCard = displayCards[currentIndex];
    if (!currentCard) return;
    let newInterval = isCorrect ? currentCard.interval * 2 : 1;
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
    try {
      await supabase.from('cards').update({ interval: newInterval, next_review_at: nextReviewDate.toISOString() }).eq('id', currentCard.id);
    } catch (e) { console.error(e); }
    setIsFlipped(false);
    setTimeout(() => { setCurrentIndex((prev) => prev + 1); }, 200);
  }

  // カードを追加（継承）
  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!newFront || !newBack) return;
    try {
      const { error } = await supabase.from('cards').insert([{ front: newFront, back: newBack, category: '一般' }]);
      if (!error) {
        setNewFront('');setNewBack('');
        alert('カードを追加しました！');
        fetchCards();
      }
    } catch (e) { alert('追加に失敗しました'); }
  }

  // ローディング
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-500 text-xs font-bold tracking-widest">
        LOADING ULTIMATE EXPERIENCE...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between antialiased">
      
      {/* 🍏 究極ヘッダー：ゲーミフィケーション要素を集約 */}
      <header className="bg-slate-900 px-6 py-3.5 border-b border-slate-800 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shadow-lg relative z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold text-white tracking-tighter">Flip-N <span className="text-blue-400">Pro</span></span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-inner ${streak > 0 ? 'bg-orange-950 text-orange-400' : 'bg-slate-800 text-slate-500'}`}>
              <motion.span animate={streak > 3 ? { scale: [1, 1.2, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }}>🔥</motion.span>
              <span>{streak}日連続学習中</span>
            </div>
          </div>
        </div>
        
        {/* レベル・称号表示（ダッシュボード要素をここにも） */}
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-black text-white shadow-md">Lv.{level}</div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-medium">称号</span>
            <span className="text-xs font-bold text-slate-100">{title}</span>
          </div>
        </div>

        {/* タブナビゲーション */}
        <nav className="flex bg-slate-950 p-1 rounded-xl overflow-x-auto">
          {['study', 'test', 'manage', 'dashboard'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeTab === tab ? 'bg-slate-800 text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-100'}`}>
              {tab === 'study' ? '暗記学習' : tab === 'test' ? '4択テスト' : tab === 'manage' ? 'カード管理' : '学習分析'}
            </button>
          ))}
        </nav>
      </header>

      {/* 1️⃣ STUDY MODE */}
      {activeTab === 'study' && (
        <main className="flex-1 flex flex-col items-center p-6 max-w-sm w-full mx-auto justify-center">
          
          {/* 操作エリア */}
          <div className="w-full flex flex-col gap-3 mb-6 bg-slate-900 p-2.5 rounded-2xl shadow-inner border border-slate-800">
            <div className="flex flex-col sm:flex-row gap-1.5 w-full">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full sm:w-auto bg-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 outline-none shadow-xs font-bold cursor-pointer min-w-[110px] border border-slate-700 text-center">
                <option value="All">すべて</option>
                {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="単語を検索..." className="flex-1 bg-slate-800 text-xs rounded-lg px-4 py-2 text-slate-200 outline-none shadow-xs border border-slate-700 font-medium" />
            </div>
          </div>

          {displayCards.length === 0 ? (
            <div className="w-full bg-slate-900 p-8 rounded-2xl text-center shadow-xs border border-slate-800">
              <p className="text-xs text-slate-500 font-medium">カードが見つかりません。</p>
            </div>
          ) : currentIndex >= displayCards.length ? (
            <div className="w-full bg-slate-900 p-8 rounded-2xl text-center shadow-sm border border-slate-800">
              <div className="text-3xl mb-3">🎉</div>
              <h2 className="text-sm font-extrabold text-slate-100 mb-1">セクション完了！</h2>
              <p className="text-xs text-slate-500 mb-5">すべてのカードをチェックしました。</p>
              <button onClick={() => setCurrentIndex(0)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition text-xs shadow-sm tracking-wide">もう一度最初から</button>
            </div>
          ) : (
            <>
              {/* 情報バッジ */}
              <div className="w-full mb-2 flex justify-between items-center text-[11px] text-slate-500 px-1">
                <span className="bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-bold tracking-wider">{displayCards[currentIndex].category || '一般'}</span>
                <span className="font-semibold tracking-wider text-slate-600">{currentIndex + 1} / {displayCards.length}</span>
              </div>

              {/* UI刷新：無駄を削ぎ落としたスタイリッシュな単語カード */}
              {/* 🔄 究極の360度インタラクティブ回転エフェクトの実装 */}
              <div className="w-full h-56 flex items-center justify-center [perspective:1000px]">
                <motion.div 
                  className="w-full h-full relative cursor-grab select-none [transform-style:preserve-3d]"
                  style={{ x, y, rotateX, rotateY }}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.05}
                  whileTap={{ cursor: "grabbing" }}
                  onTap={() => setIsFlipped(!isFlipped)} // タップで裏返し
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  {/* カードの表面 */}
                  <div className={`absolute inset-0 w-full h-full p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center backface-visibility-hidden ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
                    <h1 className="text-3xl font-extrabold text-slate-100 tracking-wide leading-tight">{displayCards[currentIndex].front}</h1>
                    <span className="text-[10px] text-slate-600 font-bold block mt-5 tracking-widest">DRAG OR TAP</span>
                  </div>

                  {/* カードの裏面（180度回転して配置） */}
                  <div className={`absolute inset-0 w-full h-full p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center [transform:rotateY(180deg)] backface-visibility-hidden ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                    <h2 className="text-2xl font-extrabold text-blue-400 mb-3 tracking-wide">{displayCards[currentIndex].back}</h2>
                    {displayCards[currentIndex].example && (
                      <p className="text-[11px] text-slate-500 bg-slate-950 p-2.5 rounded-xl border border-slate-800 italic inline-block max-w-full text-center leading-relaxed">"{displayCards[currentIndex].example}"</p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* UI刷新：AI音声分析＆リアルタイム発音判定のコントロールを追加 */}
              <div className="w-full mt-5 bg-slate-900 p-3 rounded-2xl flex flex-col items-center gap-3 border border-slate-800 shadow-inner">
                <span className="text-[10px] text-slate-600 font-bold tracking-wider"> AI音声分析・発音判定 </span>
                <div className="flex items-center gap-2">
                  <button onClick={startPronunciationAnalysis} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    <span className="text-xl">🎤</span>
                  </button>
                  <button onClick={() => speak(displayCards[currentIndex].front)} className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
                    <span className="text-xl">🔊</span>
                  </button>
                </div>
                {pronunciationScore !== null && (
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500">発音の正確さ</span>
                    <p className={`text-xl font-black ${pronunciationScore > 90 ? 'text-green-400' : pronunciationScore > 80 ? 'text-amber-400' : 'text-red-400'}`}>{pronunciationScore > 90 ? 'Excellent' : pronunciationScore > 80 ? 'Good' : 'Try Again'} ({pronunciationScore}%)</p>
                  </div>
                )}
              </div>

              {/* 操作ボタン */}
              <div className="w-full mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => handleResponse(false)} className="bg-slate-900 hover:bg-red-950 text-red-500 font-bold py-3 rounded-xl transition text-xs shadow-xs border border-slate-800 tracking-wider">
                  忘れた
                </button>
                <button onClick={() => handleResponse(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-xs shadow-sm tracking-wider">
                  覚えた
                </button>
              </div>
            </>
          )}
        </main>
      )}

      {/* 4️⃣ ANALYTICS DASHBOARD */}
      {activeTab === 'dashboard' && (
        <main className="flex-1 max-w-sm w-full mx-auto p-6 flex flex-col gap-4 justify-center">
          
          {/* UI刷新：使いたくなる！ランク付きリーダーボード（モック）を追加 */}
          <div className="bg-slate-900 p-5 rounded-2xl text-center shadow-xs border border-slate-800 mb-5">
            <h2 className="text-xs font-bold text-slate-600 mb-3.5 tracking-wider uppercase">🏆 今月のマスターランク（モック）</h2>
            <div className="flex flex-col gap-1.5">
              {[ {rank: 1, name: 'You (Nobuhiro)', score: cards.length, isUser: true}, {rank: 2, name: 'AI_Student', score: cards.length - 1, isUser: false}, {rank: 3, name: 'Sample_User', score: cards.length - 2, isUser: false} ].map((user, i) => (
                <div key={i} className={`p-2 rounded-lg flex items-center justify-between text-xs font-bold ${user.isUser ? 'bg-blue-950 text-blue-300' : 'bg-slate-800 text-slate-400'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center font-black">{user.rank}</span>
                    <span>{user.name}</span>
                  </div>
                  <span>{user.score} 枚</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* 学習進捗 */}
          <div className="bg-slate-900 p-5 rounded-2xl text-center shadow-xs border border-slate-800">
            <h2 className="text-xs font-bold text-slate-600 mb-4 tracking-wider uppercase">学習進捗パスツリー</h2>
            <div className="text-center mb-5">
              <span className="text-3xl font-black text-blue-500">{masterRate}%</span>
              <span className="text-[10px] text-slate-500 block font-bold mt-1 tracking-wider">記憶定着パス完了</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-500 block mb-0.5 font-bold">総カード数</span>
                <span className="text-xs font-extrabold text-slate-200">{cards.length} 枚</span>
              </div>
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-500 block mb-0.5 font-bold">長期記憶</span>
                <span className="text-sm font-extrabold text-green-400">{masteredCards} 枚</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* FOOTER */}
      <footer className="py-3.5 text-center text-[9px] text-slate-700 bg-slate-900 border-t border-slate-800 font-bold tracking-widest">
        FLIP-N ULTIMATE // POWERED BY NOBUHIRO SYSTEM
      </footer>
    </div>
  );
}