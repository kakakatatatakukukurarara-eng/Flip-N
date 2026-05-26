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
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-400 text-xs font-medium tracking-wider">
        LOADING...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between antialiased">
      
      {/* 🍏 洗練されたモダンヘッダー */}
      <header className="bg-white px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Flip-N</h1>
          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
            <span>🔥</span>
            <span>{streak}日連続</span>
          </div>
        </div>
        
        {/* ナビゲーションをよりフラットで現代的なタブに */}
        <nav className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab('study')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${activeTab === 'study' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>暗記学習</button>
          <button onClick={() => setActiveTab('test')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${activeTab === 'test' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>4択テスト</button>
          <button onClick={() => setActiveTab('manage')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${activeTab === 'manage' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>カード管理</button>
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>学習分析</button>
        </nav>
      </header>

      {/* 1️⃣ STUDY MODE */}
      {activeTab === 'study' && (
        <main className="flex-1 flex flex-col items-center p-6 max-w-sm w-full mx-auto justify-center">
          
          {/* 操作エリアの横幅・デザインを一体型に整頓 */}
          <div className="w-full flex flex-col gap-2.5 mb-6">
            <div className="flex flex-col sm:flex-row gap-1.5 w-full bg-slate-200/60 p-1 rounded-xl">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)} 
                className="w-full sm:w-auto bg-white text-xs rounded-lg px-3 py-1.5 text-slate-700 outline-none shadow-xs font-medium cursor-pointer min-w-[110px] border-none"
              >
                <option value="All">すべて</option>
                {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="単語を検索..." 
                className="flex-1 bg-white text-xs rounded-lg px-3 py-1.5 text-slate-700 outline-none shadow-xs border-none" 
              />
            </div>
            
            <div className="flex justify-end px-0.5">
              <button 
                onClick={() => setIsShuffle(!isShuffle)} 
                className={`text-[11px] px-3 py-1 rounded-full font-semibold transition-all shadow-xs ${isShuffle ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'}`}
              >
                {isShuffle ? '🎯 ランダム順' : '🔄 登録順'}
              </button>
            </div>
          </div>

          {displayCards.length === 0 ? (
            <div className="w-full bg-white p-8 rounded-2xl text-center shadow-xs border border-slate-100">
              <p className="text-xs text-slate-400">カードが見つかりません。</p>
            </div>
          ) : currentIndex >= displayCards.length ? (
            <div className="w-full bg-white p-8 rounded-2xl text-center shadow-sm border border-slate-100">
              <div className="text-2xl mb-2">🎉</div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">セクション完了！</h2>
              <p className="text-xs text-slate-400 mb-4">すべてのカードをチェックしました。</p>
              <button onClick={() => setCurrentIndex(0)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl transition text-xs shadow-sm">もう一度最初から</button>
            </div>
          ) : (
            <>
              {/* 情報エリアの上品なバッジ表示 */}
              <div className="w-full mb-2 flex justify-between items-center text-[11px] text-slate-400 px-0.5">
                <span className="bg-slate-200/80 px-2 py-0.5 rounded text-slate-600 font-semibold text-[10px] tracking-wide">{displayCards[currentIndex].category || '一般'}</span>
                <span className="font-medium tracking-wider">{currentIndex + 1} / {displayCards.length}</span>
              </div>

              {/* 📐 高級感のある柔らかい影のカード（h-52） */}
              <div onClick={() => setIsFlipped(!isFlipped)} className="w-full h-52 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center p-6 cursor-pointer hover:shadow-md transition-shadow relative select-none">
                <button onClick={(e) => { e.stopPropagation(); speak(isFlipped ? displayCards[currentIndex].back : displayCards[currentIndex].front); }} className="absolute bottom-3 right-3 bg-slate-50 hover:bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-xs text-slate-500 shadow-xs border border-slate-100">🔊</button>
                
                {!isFlipped ? (
                  <div className="text-center px-2">
                    <h1 className="text-xl font-bold text-slate-900 tracking-wide leading-tight">{displayCards[currentIndex].front}</h1>
                    <span className="text-[10px] text-slate-300 font-medium block mt-3 tracking-wider">TAP TO FLIP</span>
                  </div>
                ) : (
                  <div className="text-center w-full px-2">
                    <h2 className="text-lg font-bold text-blue-600 mb-2.5">{displayCards[currentIndex].back}</h2>
                    {displayCards[currentIndex].example && (
                      <p className="text-[11px] text-slate-500 bg-slate-50/50 p-2 rounded-xl border border-slate-100 italic inline-block max-w-full text-center">"{displayCards[currentIndex].example}"</p>
                    )}
                  </div>
                )}
              </div>

              {/* ボタンの文字を少し細く、スマートに変更 */}
              <div className="w-full mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => handleResponse(false)} className="bg-white hover:bg-slate-50 text-red-500 font-semibold py-2.5 rounded-xl transition text-xs shadow-xs border border-slate-200">
                  忘れた
                </button>
                <button onClick={() => handleResponse(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition text-xs shadow-sm">
                  覚えた
                </button>
              </div>
            </>
          )}
        </main>
      )}

      {/* 2️⃣ TEST MODE */}
      {activeTab === 'test' && (
        <main className="flex-1 flex flex-col items-center p-6 max-w-sm w-full mx-auto justify-center">
          {cards.length < 4 ? (
            <div className="w-full bg-white p-6 rounded-2xl text-center shadow-xs border border-slate-100">
              <p className="text-xs text-slate-400">4択クイズを遊ぶには、カード管理から単語を4枚以上登録してください。</p>
            </div>
          ) : quizIndex >= cards.length ? (
            <div className="w-full bg-white p-8 rounded-2xl text-center shadow-sm border border-slate-100">
              <div className="text-2xl mb-2">🏆</div>
              <h2 className="text-sm font-bold mb-1">テスト完了</h2>
              <p className="text-base font-bold text-blue-600 my-2">{quizScore} / {cards.length}問 正解</p>
              <button onClick={startQuiz} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl transition text-xs">もう一度テストする</button>
            </div>
          ) : (
            <div className="w-full flex flex-col">
              <div className="mb-2 flex justify-between text-[11px] text-slate-400 px-0.5">
                <span className="font-semibold text-slate-500">4択クイズ</span>
                <span className="font-medium">{quizIndex + 1} / {cards.length}問目</span>
              </div>

              <div className="w-full h-36 bg-white rounded-2xl text-center mb-4 flex items-center justify-center shadow-xs border border-slate-100 px-4">
                <h2 className="text-lg font-bold text-slate-900 tracking-wide">{cards[quizIndex].front}</h2>
              </div>

              <div className="flex flex-col gap-2 w-full">
                {quizOptions.map((option, i) => {
                  const isSelected = quizSelected === option;
                  const isCorrect = option === cards[quizIndex].back;
                  
                  let btnStyle = 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200';
                  if (quizSelected) {
                    if (isCorrect) btnStyle = 'bg-green-50 border-green-300 text-green-700 font-semibold shadow-xs';
                    else if (isSelected) btnStyle = 'bg-red-50 border-red-200 text-red-600';
                  }

                  return (
                    <button key={i} onClick={() => handleQuizAnswer(option)} disabled={quizSelected !== null} className={`w-full border text-left px-4 py-2.5 rounded-xl text-xs font-medium transition shadow-xs flex justify-between items-center ${btnStyle}`}>
                      <span>{option}</span>
                      {quizSelected && isCorrect && <span className="text-green-500 font-bold">✓</span>}
                      {quizSelected && isSelected && !isCorrect && <span className="text-red-400 font-bold">✕</span>}
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
        <main className="flex-1 max-w-sm w-full mx-auto p-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 mb-5">
            <h2 className="text-xs font-bold text-slate-800 mb-3">新しいカードを追加</h2>
            <form onSubmit={handleAddCard} className="flex flex-col gap-2.5">
              <input type="text" value={newFront} onChange={(e) => setNewFront(e.target.value)} placeholder="問題" className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-900 outline-none focus:border-blue-500 transition-all" required />
              <input type="text" value={newBack} onChange={(e) => setNewBack(e.target.value)} placeholder="答え" className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-900 outline-none focus:border-blue-500 transition-all" required />
              <input type="text" value={newExample} onChange={(e) => setNewExample(e.target.value)} placeholder="例文（省略可能）" className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-900 outline-none focus:border-blue-500 transition-all" />
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="カテゴリ" className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-900 outline-none focus:border-blue-500 transition-all" />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl transition text-xs shadow-xs mt-1">追加する</button>
            </form>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">登録済み ({cards.length})</h2>
            <div className="flex flex-col gap-2">
              {cards.map((card) => (
                <div key={card.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col gap-1.5">
                  {editingCardId === card.id ? (
                    <div className="flex flex-col gap-2">
                      <input type="text" value={editFront} onChange={(e) => setEditFront(e.target.value)} className="p-2 border rounded-lg border-slate-200 text-xs bg-white" />
                      <input type="text" value={editBack} onChange={(e) => setEditBack(e.target.value)} className="p-2 border rounded-lg border-slate-200 text-xs bg-white" />
                      <input type="text" value={editExample} onChange={(e) => setEditExample(e.target.value)} className="p-2 border rounded-lg border-slate-200 text-xs bg-white" placeholder="例文" />
                      <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="p-2 border rounded-lg border-slate-200 text-xs bg-white" placeholder="カテゴリ" />
                      <div className="flex gap-2 justify-end mt-1">
                        <button onClick={() => setEditingCardId(null)} className="text-xs text-slate-400 py-1 px-2">キャンセル</button>
                        <button onClick={() => handleUpdateCard(card.id)} className="text-xs bg-blue-600 text-white py-1 px-3 rounded-lg shadow-xs font-semibold">保存</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{card.front}</span>
                          <span className="text-[9px] bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-500 font-semibold tracking-wide">{card.category || '一般'}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{card.back}</div>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => startEditing(card)} className="text-xs text-slate-400 hover:text-blue-500 p-1">✏️</button>
                        <button onClick={() => handleDeleteCard(card.id)} className="text-xs text-slate-400 hover:text-red-500 p-1">🗑️</button>
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
        <main className="flex-1 max-w-sm w-full mx-auto p-6 flex flex-col gap-4 justify-center">
          <div className="bg-white p-5 rounded-2xl text-center shadow-xs border border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 mb-4 tracking-wider uppercase">学習進捗</h2>
            
            <div className="text-center mb-4">
              <span className="text-2xl font-black text-blue-600">{masterRate}%</span>
              <span className="text-[10px] text-slate-400 block font-medium mt-0.5">記憶定着率</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-0.5">総カード数</span>
                <span className="text-xs font-bold text-slate-700">{cards.length} 枚</span>
              </div>
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-0.5">長期記憶</span>
                <span className="text-sm font-bold text-green-600">{masteredCards} 枚</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* フッター */}
      <footer className="py-3 text-center text-[10px] text-slate-300 bg-white border-t border-slate-100 font-medium tracking-wide">
        FLIP-N // POWERED BY NOBUHIRO SYSTEM
      </footer>
    </div>
  );
}