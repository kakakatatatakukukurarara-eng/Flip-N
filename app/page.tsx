"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ⭕ コードから鍵を消去し、環境変数（秘密の引き出し）から読み込む安全な方式に変更！
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Card {
// ...ここから下は一切いじらなくて大丈夫です！
  id: number;
  front: string;
  back: string;
  example: string | null;
  category: string;
  interval: number;
  next_review_at: string;
}

export default function StudySession() {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  // 🦄 ルートA: タブに「test」を追加
  const [activeTab, setActiveTab] = useState<'study' | 'test' | 'manage' | 'dashboard'>('study');
  
  // 🎨 ルートB: ダークモード状態
  const [darkMode, setDarkMode] = useState(false);

  // クイズ用の状態
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);

  // 入力＆フィルター用
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newCategory, setNewCategory] = useState('一般');
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

  useEffect(() => {
    fetchCards();
  }, []);

  // 音声読み上げ
  function speak(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = /^[A-Za-z0-9\s,.:?!'"-]+$/.test(text) ? 'en-US' : 'ja-JP';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  useEffect(() => {
    if (activeTab === 'study' && filteredCards[currentIndex]) {
      speak(isFlipped ? filteredCards[currentIndex].back : filteredCards[currentIndex].front);
    }
  }, [isFlipped, currentIndex, activeTab]);

  // 🦄 ルートA: 4択クイズの選択肢を作るロジック
  function startQuiz() {
    if (cards.length < 4) {
      alert('クイズで遊ぶには、カードを4枚以上登録してください！');
      return;
    }
    setQuizStarted(true);
    setQuizIndex(0);
    setQuizScore(0);
    makeQuizOptions(0);
  }

  function makeQuizOptions(index: number) {
    setQuizSelected(null);
    const correctAnswer = cards[index].back;
    
    // 他のカードから誤答をシャッフルして持ってくる
    const wrongAnswers = cards
      .filter(c => c.back !== correctAnswer)
      .map(c => c.back)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // 正解と誤答を混ぜて4択にする
    const options = [correctAnswer, ...wrongAnswers].sort(() => 0.5 - Math.random());
    setQuizOptions(options);
  }

  function handleQuizAnswer(option: string) {
    if (quizSelected) return; // 連続クリック防止
    setQuizSelected(option);
    
    const isCorrect = option === cards[quizIndex].back;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      speak('Correct!');
    } else {
      speak('Wrong');
    }

    setTimeout(() => {
      if (quizIndex + 1 < cards.length) {
        setQuizIndex(prev => prev + 1);
        makeQuizOptions(quizIndex + 1);
      } else {
        setQuizIndex(prev => prev + 1); // 終了画面へ
      }
    }, 1500);
  }

  // 復習タイミングの計算
  async function handleResponse(isCorrect: boolean) {
    const currentCard = filteredCards[currentIndex];
    if (!currentCard) return;

    let newInterval = isCorrect ? currentCard.interval * 2 : 1;
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    try {
      await supabase
        .from('cards')
        .update({ interval: newInterval, next_review_at: nextReviewDate.toISOString() })
        .eq('id', currentCard.id);
    } catch (e) {
      console.error(e);
    }

    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 200);
  }

  // カードを追加
  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!newFront || !newBack) return;

    try {
      const { error } = await supabase.from('cards').insert([
        { front: newFront, back: newBack, example: newExample || null, category: newCategory }
      ]);
      if (!error) {
        setNewFront('');setNewBack('');setNewExample('');
        alert('カードを追加しました！');
        fetchCards();
      }
    } catch (e) {
      alert('追加に失敗しました');
    }
  }

  async function handleDeleteCard(id: number) {
    if (!confirm('このカードを削除しますか？')) return;
    try {
      await supabase.from('cards').delete().eq('id', id);
      fetchCards();
      setCurrentIndex(0);
    } catch (e) {
      alert('削除失敗');
    }
  }

  const filteredCards = cards.filter(card => {
    const matchesCategory = selectedCategory === 'All' || card.category === selectedCategory;
    const matchesSearch = card.front.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          card.back.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const uniqueCategories = Array.from(new Set(cards.map(c => c.category || '一般')));
  const masteredCards = cards.filter(c => c.interval > 1).length;
  const masterRate = cards.length > 0 ? Math.round((masteredCards / cards.length) * 100) : 0;

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen text-sm font-medium ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
        読み込み中...
      </div>
    );
  }

  return (
    // 🎨 ルートB: 全体の背景色をダークモードに対応
    <div className={`min-h-screen font-sans flex flex-col justify-between transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* 🍏 ヘッダー */}
      <header className={`px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 shadow-sm border-b transition-colors duration-300 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center w-full md:w-auto">
          <h1 className="text-xl font-bold tracking-tight">Flip-N 単語帳</h1>
          {/* 🎨 ルートB: ダークモード切り替えスイッチ */}
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl text-sm border shadow-sm transition-all md:hidden`}>
            {darkMode ? '☀️ ライト' : '🌙 ダーク'}
          </button>
        </div>
        
        <nav className="flex flex-wrap gap-1 items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button onClick={() => { setActiveTab('study'); setIsFlipped(false); setCurrentIndex(0); }} className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'study' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}>暗記学習</button>
          <button onClick={() => { setActiveTab('test'); startQuiz(); }} className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'test' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}>4択テスト</button>
          <button onClick={() => setActiveTab('manage')} className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'manage' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}>カード管理</button>
          <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'dashboard' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}>学習分析</button>
          
          <button onClick={() => setDarkMode(!darkMode)} className={`hidden md:block ml-2 px-3 py-1.5 text-xs rounded-lg font-medium border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 shadow-sm`}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </nav>
      </header>

      {/* 1️⃣ STUDY MODE (暗記学習) */}
      {activeTab === 'study' && (
        <main className="flex-1 flex flex-col items-center justify-between p-4 max-w-md w-full mx-auto my-auto">
          <div className="w-full flex gap-2 mb-6">
            <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setCurrentIndex(0); }} className={`border text-xs rounded-xl px-3 py-2 outline-none shadow-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-200'}`}>
              <option value="All">すべてのカテゴリ</option>
              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentIndex(0); }} placeholder="キーワードで検索..." className={`flex-1 border text-xs rounded-xl px-4 py-2 outline-none shadow-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-blue-500' : 'bg-white border-gray-200 focus:border-blue-500'}`} />
          </div>

          {filteredCards.length === 0 ? (
            <div className={`my-auto w-full border p-8 rounded-2xl text-center shadow-sm ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <p className="text-sm text-gray-400">カードが見つかりません。</p>
            </div>
          ) : currentIndex >= filteredCards.length ? (
            <div className={`my-auto w-full border p-8 rounded-3xl text-center shadow-md ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-xl font-bold mb-2">お疲れ様でした！</h2>
              <p className="text-sm text-gray-500 mb-6">このセクションの復習はすべて完了しました。</p>
              <button onClick={() => setCurrentIndex(0)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition text-sm shadow-sm">もう一度学習する</button>
            </div>
          ) : (
            <>
              <div className="w-full mb-6">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5 font-medium">
                  <span>{filteredCards[currentIndex].category || '一般'}</span>
                  <span>{currentIndex + 1} / {filteredCards.length}</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }} />
                </div>
              </div>

              {/* 🎨 ルートB: 3D回転アニメーション付きのカード */}
              <div className="w-full h-80 [perspective:1000px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                  
                  {/* カード表面 */}
                  <div className={`absolute inset-0 w-full h-full p-8 border rounded-3xl shadow-md flex flex-col items-center justify-center [backface-visibility:hidden] transition-colors ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <div className="absolute top-4 right-4 bg-gray-100 dark:bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-[10px] font-medium border border-gray-200 dark:border-gray-700">熟練度 LV.{filteredCards[currentIndex].interval}</div>
                    <span className="text-[10px] font-bold tracking-wider text-gray-300 block mb-2">QUESTION</span>
                    <h1 className="text-3xl font-bold text-center">{filteredCards[currentIndex].front}</h1>
                    <button onClick={(e) => { e.stopPropagation(); speak(filteredCards[currentIndex].front); }} className="absolute bottom-4 right-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition text-sm text-gray-500">🔊</button>
                  </div>

                  {/* カード裏面 */}
                  <div className={`absolute inset-0 w-full h-full p-8 border rounded-3xl shadow-md flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] transition-colors ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-blue-100'}`}>
                    <span className="text-[10px] font-bold tracking-wider text-blue-400 block mb-2">ANSWER</span>
                    <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400 text-center">{filteredCards[currentIndex].back}</h2>
                    {filteredCards[currentIndex].example && (
                      <p className={`text-xs p-3 rounded-xl border italic text-center w-full ${darkMode ? 'bg-gray-950 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>"{filteredCards[currentIndex].example}"</p>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); speak(filteredCards[currentIndex].back); }} className="absolute bottom-4 right-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition text-sm text-gray-500">🔊</button>
                  </div>

                </div>
              </div>

              <div className="w-full mt-8 grid grid-cols-2 gap-4">
                <button onClick={() => handleResponse(false)} className={`border hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 font-semibold py-3.5 rounded-2xl transition active:scale-95 text-xs shadow-sm flex flex-col items-center justify-center gap-0.5 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <span>❌ 忘れた</span>
                  <span className="text-[9px] text-gray-400 font-normal">明日もう一度復習</span>
                </button>
                <button onClick={() => handleResponse(true)} className={`border hover:bg-green-50 dark:hover:bg-green-950/30 text-green-600 dark:text-green-400 font-semibold py-3.5 rounded-2xl transition active:scale-95 text-xs shadow-sm flex flex-col items-center justify-center gap-0.5 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <span>⭕ 覚えた</span>
                  <span className="text-[9px] text-gray-400 font-normal">{filteredCards[currentIndex].interval * 2}日後に復習</span>
                </button>
              </div>
            </>
          )}
        </main>
      )}

      {/* 2️⃣ 🦄 ルートA: クイズモード画面 */}
      {activeTab === 'test' && (
        <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md w-full mx-auto my-auto">
          {cards.length < 4 ? (
            <div className={`w-full border p-8 rounded-2xl text-center shadow-sm ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <p className="text-sm text-gray-400">クイズで遊ぶには、カード管理から単語を4枚以上追加してください！</p>
            </div>
          ) : quizIndex >= cards.length ? (
            /* クイズ結果画面 */
            <div className={`w-full border p-8 rounded-3xl text-center shadow-md ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-xl font-bold mb-2">テスト終了！</h2>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 my-4">{quizScore} / {cards.length} 正解</p>
              <button onClick={startQuiz} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition text-sm shadow-sm">もう一度挑戦する</button>
            </div>
          ) : (
            /* クイズ進行中画面 */
            <div className="w-full flex flex-col">
              <div className="mb-4 flex justify-between text-xs text-gray-400 font-medium">
                <span>4択クイズモード</span>
                <span>{quizIndex + 1} / {cards.length}問目</span>
              </div>

              {/* クイズ問題表示エリア */}
              <div className={`w-full p-8 border rounded-3xl shadow-sm text-center mb-6 min-h-40 flex items-center justify-center ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-gray-300 block mb-2">QUESTION</span>
                  <h2 className="text-2xl font-bold">{cards[quizIndex].front}</h2>
                </div>
              </div>

              {/* 4つの選択肢ボタン */}
              <div className="flex flex-col gap-3 w-full">
                {quizOptions.map((option, i) => {
                  const isSelected = quizSelected === option;
                  const isCorrect = option === cards[quizIndex].back;
                  
                  let btnStyle = darkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50';
                  if (quizSelected) {
                    if (isCorrect) btnStyle = 'bg-green-100 border-green-400 text-green-700 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800';
                    else if (isSelected) btnStyle = 'bg-red-100 border-red-400 text-red-700 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800';
                  }

                  return (
                    <button key={i} onClick={() => handleQuizAnswer(option)} disabled={quizSelected !== null} className={`w-full border text-left px-5 py-3.5 rounded-2xl text-sm font-medium transition active:scale-[0.99] shadow-sm flex justify-between items-center ${btnStyle}`}>
                      <span>{option}</span>
                      {quizSelected && isCorrect && <span className="text-green-500 font-bold">⭕</span>}
                      {quizSelected && isSelected && !isCorrect && <span className="text-red-500 font-bold">❌</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      )}

      {/* 3️⃣ DATABASE MODE (カード管理) */}
      {activeTab === 'manage' && (
        <main className="flex-1 max-w-md w-full mx-auto p-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div className={`border p-5 rounded-2xl shadow-sm mb-6 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h2 className="text-sm font-bold mb-4">新しいカードを追加</h2>
            <form onSubmit={handleAddCard} className="flex flex-col gap-3">
              <input type="text" value={newFront} onChange={(e) => setNewFront(e.target.value)} placeholder="問題（例: Diligent）" className={`w-full p-2.5 rounded-xl border text-xs outline-none transition ${darkMode ? 'bg-gray-950 border-gray-800 text-gray-100 focus:border-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'}`} required />
              <input type="text" value={newBack} onChange={(e) => setNewBack(e.target.value)} placeholder="答え（例: 勤勉な）" className={`w-full p-2.5 rounded-xl border text-xs outline-none transition ${darkMode ? 'bg-gray-950 border-gray-800 text-gray-100 focus:border-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'}`} required />
              <input type="text" value={newExample} onChange={(e) => setNewExample(e.target.value)} placeholder="例文（省略可能）" className={`w-full p-2.5 rounded-xl border text-xs outline-none transition ${darkMode ? 'bg-gray-950 border-gray-800 text-gray-100 focus:border-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'}`} />
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="カテゴリ（例: 英語, 歴史, プログラミング）" className={`w-full p-2.5 rounded-xl border text-xs outline-none transition ${darkMode ? 'bg-gray-950 border-gray-800 text-gray-100 focus:border-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'}`} />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition text-xs shadow-sm">カードを登録する</button>
            </form>
          </div>

          <div className={`border p-4 rounded-2xl shadow-sm ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h2 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">登録済みのカード ({cards.length})</h2>
            <div className="flex flex-col gap-2">
              {cards.map((card) => (
                <div key={card.id} className={`flex items-center justify-between p-3 border rounded-xl ${darkMode ? 'bg-gray-950 border-gray-900' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{card.front}</span>
                      <span className={`text-[9px] border px-1.5 py-0.5 rounded-md font-medium ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>{card.category || '一般'}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{card.back}</div>
                  </div>
                  <button onClick={() => handleDeleteCard(card.id)} className="text-gray-400 hover:text-red-500 p-1.5 transition text-xs">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* 4️⃣ ANALYTICS DASHBOARD (学習分析) */}
      {activeTab === 'dashboard' && (
        <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col gap-4 justify-center">
          <div className={`border p-6 rounded-3xl text-center shadow-sm ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h2 className="text-xs font-bold text-gray-400 mb-6 tracking-wider uppercase">学習進捗レポート</h2>
            
            <div className={`relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-4 mb-4 ${darkMode ? 'border-gray-800 border-t-blue-500 shadow-blue-500/5' : 'border-gray-100 border-t-blue-500'}`}>
              <div className="text-center">
                <span className="text-2xl font-bold">{masterRate}%</span>
                <span className="text-[9px] text-gray-400 block font-medium">記憶定着率</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                <span className="text-[10px] text-gray-400 block mb-1 font-medium">総カード数</span>
                <span className="text-lg font-bold">{cards.length} 枚</span>
              </div>
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                <span className="text-[10px] text-gray-400 block mb-1 font-medium">長期記憶カード</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">{masteredCards} 枚</span>
              </div>
            </div>

            <div className={`mt-4 p-4 rounded-xl border text-left ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
              <span className="text-[10px] text-gray-400 block mb-2 font-medium">登録されているカテゴリ</span>
              <div className="flex flex-wrap gap-1.5">
                {uniqueCategories.map(cat => (
                  <span key={cat} className={`text-[10px] font-medium border px-2.5 py-1 rounded-lg ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {cat} ({cards.filter(c => c.category === cat).length})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* フッター */}
      <footer className={`py-3 text-center text-[10px] text-gray-400 border-t transition-colors ${darkMode ? 'bg-gray-950 border-gray-900' : 'bg-white border-gray-200'}`}>
        Flip-N アプリ v3.0 Ultimate // Powered by Nobuhiro System
      </footer>
    </div>
  );
}