"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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

export default function StudySession() {
  const [cards, setCards] = useState<Card[]>([]);
  const [displayCards, setDisplayCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'study' | 'test' | 'manage' | 'dashboard'>('study');

  // 🔥 ストリーク
  const [streak, setStreak] = useState(0);
  // 🎯 シャッフル
  const [isShuffle, setIsShuffle] = useState(false);

  // クイズ用の状態
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

  // 編集機能用の状態
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [editExample, setEditExample] = useState('');
  const [editCategory, setEditCategory] = useState('');

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

  // ログインストリーク計算
  useEffect(() => {
    fetchCards();
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

  // フィルター・検索・シャッフル
  useEffect(() => {
    let result = cards.filter(card => {
      const matchesCategory = selectedCategory === 'All' || card.category === selectedCategory;
      const matchesSearch = card.front.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            card.back.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (isShuffle) {
      result = [...result].sort(() => 0.5 - Math.random());
    }

    setDisplayCards(result);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards, selectedCategory, searchQuery, isShuffle]);

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
    if (activeTab === 'study' && displayCards[currentIndex]) {
      speak(isFlipped ? displayCards[currentIndex].back : displayCards[currentIndex].front);
    }
  }, [isFlipped, currentIndex, activeTab]);

  function startQuiz() {
    if (cards.length < 4) return;
    setQuizIndex(0);
    setQuizScore(0);
    makeQuizOptions(0);
  }

  useEffect(() => {
    if (activeTab === 'test') startQuiz();
  }, [activeTab, cards]);

  function makeQuizOptions(index: number) {
    setQuizSelected(null);
    const correctAnswer = cards[index].back;
    const wrongAnswers = cards
      .filter(c => c.back !== correctAnswer)
      .map(c => c.back)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const options = [correctAnswer, ...wrongAnswers].sort(() => 0.5 - Math.random());
    setQuizOptions(options);
  }

  function handleQuizAnswer(option: string) {
    if (quizSelected) return;
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
        setQuizIndex(prev => prev + 1);
      }
    }, 1200);
  }

  async function handleResponse(isCorrect: boolean) {
    const currentCard = displayCards[currentIndex];
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

  function startEditing(card: Card) {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditExample(card.example || '');
    setEditCategory(card.category || '一般');
  }

  async function handleUpdateCard(id: number) {
    if (!editFront || !editBack) return;
    try {
      const { error } = await supabase
        .from('cards')
        .update({ front: editFront, back: editBack, example: editExample || null, category: editCategory })
        .eq('id', id);

      if (!error) {
        setEditingCardId(null);
        fetchCards();
      }
    } catch (e) {
      alert('更新に失敗しました');
    }
  }

  async function handleDeleteCard(id: number) {
    if (!confirm('このカードを削除しますか？')) return;
    try {
      await supabase.from('cards').delete().eq('id', id);
      fetchCards();
    } catch (e) {
      alert('削除失敗');
    }
  }

  const uniqueCategories = Array.from(new Set(cards.map(c => c.category || '一般')));
  const masteredCards = cards.filter(c => c.interval > 1).length;
  const masterRate = cards.length > 0 ? Math.round((masteredCards / cards.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 text-xs font-medium">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col justify-between">
      
      {/* 🍏 ヘッダー：上下のパディングと文字サイズのバランスを調整 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Flip-N 単語帳</h1>
          <div className="flex items-center gap-1 bg-orange-50 border border-orange-100 text-orange-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <span>🔥</span>
            <span>{streak}日連続</span>
          </div>
        </div>
        
        {/* メニューのボタン幅と余白をすっきり均等に */}
        <nav className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab('study')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${activeTab === 'study' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}>暗記学習</button>
          <button onClick={() => setActiveTab('test')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${activeTab === 'test' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}>4択テスト</button>
          <button onClick={() => setActiveTab('manage')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${activeTab === 'manage' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}>カード管理</button>
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}>学習分析</button>
        </nav>
      </header>

      {/* 1️⃣ STUDY MODE */}
      {activeTab === 'study' && (
        <main className="flex-1 flex flex-col items-center p-6 max-w-md w-full mx-auto justify-center">
          
          {/* 検索・操作エリアのバランスを最適化 */}
          <div className="w-full flex flex-col gap-3 mb-5">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              {/* カテゴリ選択：スマホでは全幅、PCでは適切な幅に */}
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)} 
                className="w-full sm:w-auto bg-white border border-gray-300 text-xs rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-blue-500 shadow-xs cursor-pointer min-w-[120px]"
              >
                <option value="All">すべてのカテゴリ</option>
                {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              
              {/* 検索バー：残りのスペースを綺麗に埋める */}
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="単語を検索..." 
                className="flex-1 bg-white border border-gray-300 text-xs rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-blue-500 shadow-xs" 
              />
            </div>
            
            {/* シャッフルボタン：位置を少し下げて独立させ、押しやすく */}
            <div className="flex justify-end">
              <button 
                onClick={() => setIsShuffle(!isShuffle)} 
                className={`text-[11px] px-3 py-1.5 rounded-md border font-medium transition-all shadow-xs ${isShuffle ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {isShuffle ? '🎯 ランダム順' : '🔄 登録順'}
              </button>
            </div>
          </div>

          {displayCards.length === 0 ? (
            <div className="w-full bg-white border border-gray-200 p-8 rounded-xl text-center shadow-xs">
              <p className="text-xs text-gray-400">カードが見つかりません。</p>
            </div>
          ) : currentIndex >= displayCards.length ? (
            <div className="w-full bg-white border border-gray-200 p-8 rounded-xl text-center shadow-xs">
              <div className="text-2xl mb-2">🎉</div>
              <h2 className="text-sm font-bold text-gray-900 mb-1">セクション完了！</h2>
              <p className="text-xs text-gray-500 mb-4">すべてのカードをチェックしました。</p>
              <button onClick={() => setCurrentIndex(0)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition text-xs shadow-xs">もう一度最初から</button>
            </div>
          ) : (
            <>
              {/* 情報表示エリアの幅と余白を最適化 */}
              <div className="w-full mb-2 flex justify-between items-center text-[11px] text-gray-500 px-1">
                <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-600 font-medium">{displayCards[currentIndex].category || '一般'}</span>
                <span className="font-medium">{currentIndex + 1} / {displayCards.length}</span>
              </div>

              {/* 📐 カードのサイズ感を縦長から「使いやすい手頃な比率（h-52）」へ修正 */}
              <div onClick={() => setIsFlipped(!isFlipped)} className="w-full h-52 bg-white border border-gray-200 rounded-xl shadow-xs flex flex-col items-center justify-center p-6 cursor-pointer hover:border-gray-300 relative select-none">
                <button onClick={(e) => { e.stopPropagation(); speak(isFlipped ? displayCards[currentIndex].back : displayCards[currentIndex].front); }} className="absolute top-3 right-3 bg-gray-50 hover:bg-gray-100 w-7 h-7 rounded-full flex items-center justify-center text-xs text-gray-500 border border-gray-200">🔊</button>
                
                {!isFlipped ? (
                  <div className="text-center px-4">
                    <h1 className="text-xl font-bold text-gray-900 tracking-wide leading-tight">{displayCards[currentIndex].front}</h1>
                    <span className="text-[10px] text-gray-400 block mt-3">タップして答えを表示</span>
                  </div>
                ) : (
                  <div className="text-center w-full px-4">
                    <h2 className="text-lg font-bold text-blue-600 mb-3">{displayCards[currentIndex].back}</h2>
                    {displayCards[currentIndex].example && (
                      <p className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 italic inline-block max-w-full text-center">"{displayCards[currentIndex].example}"</p>
                    )}
                  </div>
                )}
              </div>

              {/* ボタンの高さとフォントサイズのバランス調整 */}
              <div className="w-full mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => handleResponse(false)} className="bg-white border border-gray-300 hover:bg-red-50 hover:border-red-200 text-red-600 font-medium py-2.5 rounded-lg transition text-xs shadow-xs">
                  ❌ 忘れた
                </button>
                <button onClick={() => handleResponse(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition text-xs shadow-xs">
                  ⭕ 覚えた
                </button>
              </div>
            </>
          )}
        </main>
      )}

      {/* 2️⃣ TEST MODE */}
      {activeTab === 'test' && (
        <main className="flex-1 flex flex-col items-center p-6 max-w-md w-full mx-auto justify-center">
          {cards.length < 4 ? (
            <div className="w-full bg-white border border-gray-200 p-6 rounded-xl text-center shadow-xs">
              <p className="text-xs text-gray-500">4択クイズを遊ぶには、カード管理から単語を4枚以上登録してください。</p>
            </div>
          ) : quizIndex >= cards.length ? (
            <div className="w-full bg-white border border-gray-200 p-8 rounded-xl text-center shadow-xs">
              <div className="text-2xl mb-2">🏆</div>
              <h2 className="text-sm font-bold mb-1">テスト完了</h2>
              <p className="text-base font-bold text-blue-600 my-2">{quizScore} / {cards.length}問 正解</p>
              <button onClick={startQuiz} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition text-xs">もう一度テストする</button>
            </div>
          ) : (
            <div className="w-full flex flex-col">
              <div className="mb-2 flex justify-between text-[11px] text-gray-500 px-1">
                <span>4択クイズ</span>
                <span>{quizIndex + 1} / {cards.length}問目</span>
              </div>

              {/* クイズ出題エリアの高さバランスを調整 */}
              <div className="w-full h-36 bg-white border border-gray-200 rounded-xl text-center mb-4 flex items-center justify-center shadow-xs px-4">
                <h2 className="text-lg font-bold text-gray-900">{cards[quizIndex].front}</h2>
              </div>

              <div className="flex flex-col gap-2 w-full">
                {quizOptions.map((option, i) => {
                  const isSelected = quizSelected === option;
                  const isCorrect = option === cards[quizIndex].back;
                  
                  let btnStyle = 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700';
                  if (quizSelected) {
                    if (isCorrect) btnStyle = 'bg-green-50 border-green-300 text-green-700 font-semibold';
                    else if (isSelected) btnStyle = 'bg-red-50 border-red-300 text-red-700';
                  }

                  return (
                    <button key={i} onClick={() => handleQuizAnswer(option)} disabled={quizSelected !== null} className={`w-full border text-left px-4 py-2.5 rounded-lg text-xs font-medium transition shadow-xs flex justify-between items-center ${btnStyle}`}>
                      <span>{option}</span>
                      {quizSelected && isCorrect && <span className="text-green-600">⭕</span>}
                      {quizSelected && isSelected && !isCorrect && <span className="text-red-600">❌</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      )}

      {/* 3️⃣ DATABASE MODE */}
      {activeTab === 'manage' && (
        <main className="flex-1 max-w-md w-full mx-auto p-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs mb-5">
            <h2 className="text-xs font-bold text-gray-800 mb-3">新しいカードを追加</h2>
            <form onSubmit={handleAddCard} className="flex flex-col gap-2">
              <input type="text" value={newFront} onChange={(e) => setNewFront(e.target.value)} placeholder="問題（例: Apple）" className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 outline-none focus:border-blue-500 transition-all" required />
              <input type="text" value={newBack} onChange={(e) => setNewBack(e.target.value)} placeholder="答え（例: りんご）" className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 outline-none focus:border-blue-500 transition-all" required />
              <input type="text" value={newExample} onChange={(e) => setNewExample(e.target.value)} placeholder="例文（省略可能）" className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 outline-none focus:border-blue-500 transition-all" />
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="カテゴリ（例: 英語）" className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 outline-none focus:border-blue-500 transition-all" />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition text-xs shadow-xs mt-1">追加する</button>
            </form>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
            <h2 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">登録済みのカード ({cards.length})</h2>
            <div className="flex flex-col gap-2">
              {cards.map((card) => (
                <div key={card.id} className="p-3 border border-gray-150 rounded-lg bg-gray-50 flex flex-col gap-1.5">
                  {editingCardId === card.id ? (
                    <div className="flex flex-col gap-2">
                      <input type="text" value={editFront} onChange={(e) => setEditFront(e.target.value)} className="p-2 border rounded-lg border-gray-300 text-xs bg-white" />
                      <input type="text" value={editBack} onChange={(e) => setEditBack(e.target.value)} className="p-2 border rounded-lg border-gray-300 text-xs bg-white" />
                      <input type="text" value={editExample} onChange={(e) => setEditExample(e.target.value)} className="p-2 border rounded-lg border-gray-300 text-xs bg-white" placeholder="例文" />
                      <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="p-2 border rounded-lg border-gray-300 text-xs bg-white" placeholder="カテゴリ" />
                      <div className="flex gap-2 justify-end mt-1">
                        <button onClick={() => setEditingCardId(null)} className="text-xs text-gray-500 py-1 px-2">キャンセル</button>
                        <button onClick={() => handleUpdateCard(card.id)} className="text-xs bg-blue-600 text-white py-1 px-3 rounded-md shadow-xs">保存</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-gray-900">{card.front}</span>
                          <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-medium">{card.category || '一般'}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">{card.back}</div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEditing(card)} className="text-xs text-gray-400 hover:text-blue-500 p-1">✏️</button>
                        <button onClick={() => handleDeleteCard(card.id)} className="text-xs text-gray-400 hover:text-red-500 p-1">🗑️</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* 4️⃣ ANALYTICS DASHBOARD */}
      {activeTab === 'dashboard' && (
        <main className="flex-1 max-w-md w-full mx-auto p-6 flex flex-col gap-4 justify-center">
          <div className="bg-white border border-gray-200 p-5 rounded-xl text-center shadow-xs">
            <h2 className="text-xs font-bold text-gray-400 mb-4 tracking-wider uppercase">学習進捗</h2>
            
            <div className="text-center mb-4">
              <span className="text-2xl font-black text-blue-600">{masterRate}%</span>
              <span className="text-[10px] text-gray-400 block font-medium mt-0.5">記憶定着率</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-400 block mb-0.5">総カード数</span>
                <span className="text-xs font-bold text-gray-700">{cards.length} 枚</span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-400 block mb-0.5">長期記憶</span>
                <span className="text-sm font-bold text-green-600">{masteredCards} 枚</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* フッター */}
      <footer className="py-3 text-center text-[10px] text-gray-400 border-t border-gray-200 bg-white">
        Flip-N アプリ v4.1 Standard // Powered by Nobuhiro System
      </footer>
    </div>
  );
}