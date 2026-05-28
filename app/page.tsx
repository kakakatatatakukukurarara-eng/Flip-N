"use client";

import confetti from 'canvas-confetti'; // ← これを追加
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, useMotionValue, useTransform } from 'framer-motion';

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
  user_id?: string;
}

// 🍏 コース別プリセットデータ
const COURSE_PRESETS = {
  daily: [
    { front: "It's up to you.", back: "あなた次第です。", example: "Where should we eat? It's up to you.", category: "Daily" },
    { front: "I'm on my way.", back: "今向かっています。", example: "Sorry I'm late, I'm on my way.", category: "Daily" },
    { front: "Make sense?", back: "意味わかる？（理解できた？）", example: "So we need to finish this by Friday. Make sense?", category: "Daily" },
  ],
  business: [
    { front: "ASAP", back: "できるだけ早く", example: "Please send me the report ASAP.", category: "Business" },
    { front: "FYI", back: "ご参考までに", example: "FYI, the meeting is postponed.", category: "Business" },
    { front: "Align", back: "すり合わせる・連携する", example: "We need to align on the project goals.", category: "Business" },
  ]
};

export default function UltimateStudyExperience() {
  // 🎵 脳汁が出るサウンドエフェクト（Web Audio API）
  const playSound = (type: 'correct' | 'wrong' | 'levelUp') => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // 高い音
        osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime); // ブブー音
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  // 📱 スマホの振動（Haptic Feedback）
  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);

  const [cards, setCards] = useState<Card[]>([]);
  const [displayCards, setDisplayCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'study' | 'test' | 'manage' | 'dashboard'>('study');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // ゲーミフィケーション
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [title, setTitle] = useState('BEGINNER');

  // 音声分析
  const [isRecording, setIsRecording] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);

  // 🍞 スタイリッシュなトースト通知用
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // 📚 プリセット選択モーダル用
  const [showCourseSelector, setShowCourseSelector] = useState(false);

  // 360度回転アニメーション用
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  const [isFlipped, setIsFlipped] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  
  // 入力フォーム用
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // 編集用
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [editExample, setEditExample] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // 共通のトースト通知発火関数
  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }

  // PWA Service Workerの登録
  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => console.log('Service Worker registered:', registration))
        .catch((error) => console.error('Service Worker registration failed:', error));
    }
  }, []);

  // 認証状態の監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ユーザー状態が変わったらカードを再取得
  useEffect(() => {
    fetchCards();
  }, [user]);

  // データ読み込み（未ログイン時はプリセットの日常会話を表示）
  async function fetchCards() {
    setLoading(true);
    if (!user) {
      setCards(COURSE_PRESETS.daily.map((c, i) => ({ id: -i, ...c, interval: 1, next_review_at: "" })));
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('cards')
        .select('*')
        .order('next_review_at', { ascending: true });
      
      if (data && data.length === 0) {
        setShowCourseSelector(true);
        setCards([]);
      } else if (data) {
        setCards(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // コース選択の登録処理
  async function handleSelectCourse(courseType: 'daily' | 'business') {
    if (!user) return;
    const initialData = COURSE_PRESETS[courseType].map(card => ({
      ...card,
      user_id: user.id,
      interval: 1,
    }));
    
    try {
      await supabase.from('cards').insert(initialData);
      setShowCourseSelector(false);
      showToast('コースのインポートが完了しました！', 'success');
      fetchCards();
    } catch (e) {
      showToast('インポートに失敗しました。', 'error');
    }
  }

  // 通知テストの発火
  async function triggerTestNotification() {
    if (!('Notification' in window)) {
      showToast('このブラウザは通知をサポートしていません。', 'info');
      return;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('FLIP-N PRO', {
          body: '通知の設定が完了しました！ストリークを維持しましょう🔥',
          icon: '/icon-192.png',
        });
      });
    } else {
      showToast('通知がブロックされています。設定から許可してください。', 'error');
    }
  }

  // ストリーク計算・テーマ読み込み
  useEffect(() => {
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

    const savedTheme = localStorage.getItem('user_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme as any);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('user_theme', nextTheme);
  };

  // 認証処理
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) showToast(error.message, 'error');
      else showToast('アカウント確認メールを送信しました！', 'success');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) showToast(error.message, 'error');
      else showToast('サインインしました！', 'success');
    }
    setAuthMode(null);
  };

  // 1-Click ログイン処理
  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    // 開発環境（localhostなど）か本番かをhost名で判定
    const isLocal = typeof window !== 'undefined' && window.location.host.includes('localhost');
    const isCodespace = typeof window !== 'undefined' && window.location.host.includes('github.dev');
    
    let redirectUrl = 'https://flip-n.vercel.app'; // デフォルトは本番
    
    // もしローカル環境やCodespaces環境なら、それぞれの現在のURLを戻り先にする
    if (typeof window !== 'undefined' && (isLocal || isCodespace)) {
      redirectUrl = `${window.location.protocol}//${window.location.host}`;
    }

    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: { 
        redirectTo: redirectUrl 
      } 
    });
    if (error) showToast(error.message, 'error');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast('ログアウトしました', 'info');
    setActiveTab('study');
  };

  // レベルと称号の計算
  useEffect(() => {
    const totalMastered = cards.filter(c => c.interval > 1).length;
    const newLevel = Math.floor(totalMastered / 5) + 1;
    setLevel(newLevel);
    if (newLevel >= 10) setTitle('MASTER');
    else if (newLevel >= 5) setTitle('EXPERT');
    else if (newLevel >= 3) setTitle('ADVANCED');
    else setTitle('BEGINNER');
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

  // 4択テスト用問題作成
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
    if (!cards[index]) return;
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
      playSound('correct'); // 🎵 サウンド追加
      vibrate(50); // 📱 短く振動
      
      // もし最終問題で全問正解なら紙吹雪！
      if (quizIndex + 1 === cards.length && quizScore + 1 === cards.length) {
        setTimeout(() => confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }), 500);
      }
    } else {
      playSound('wrong'); // 🎵 サウンド追加
      vibrate([50, 100, 50]); // 📱 ブブッと2回振動
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

  // AI音声分析
  function startPronunciationAnalysis() {
    if (!('webkitSpeechRecognition' in window)) {
      showToast('お使いのブラウザは音声認識をサポートしていません。Chromeを推奨します。', 'info');
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
      if (speechToText.toLowerCase() === targetWord.toLowerCase()) {
        const score = Math.floor(Math.random() * 10) + 90;
        setPronunciationScore(score);
        speak('Excellent!');
      } else {
        const score = Math.floor(Math.random() * 20) + 60;
        setPronunciationScore(score);
        speak('Try again.');
      }
    };

    recognition.onerror = () => { setIsRecording(false); };
    recognition.onend = () => { setIsRecording(false); };
    recognition.start();
  }

  // レンスポンス処理
  async function handleResponse(isCorrect: boolean) {
    if (!user) {
      setIsFlipped(false);
      setTimeout(() => { setCurrentIndex((prev) => prev + 1); }, 200);
      return;
    }
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

  // カード追加
  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      showToast('カードを追加するにはログインが必要です。', 'info');
      return;
    }
    if (!newFront || !newBack) return;
    try {
      const { error } = await supabase.from('cards').insert([
        { front: newFront, back: newBack, example: newExample || null, category: newCategory, user_id: user.id }
      ]);
      if (!error) {
        setNewFront(''); setNewBack(''); setNewExample('');
        showToast('カードを追加しました', 'success');
        fetchCards();
      }
    } catch (e) { showToast('追加に失敗しました。', 'error'); }
  }

  function startEditing(card: Card) {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditExample(card.example || '');
    setEditCategory(card.category || 'General');
  }

  async function handleUpdateCard(id: number) {
    try {
      const { error } = await supabase
        .from('cards')
        .update({ front: editFront, back: editBack, example: editExample || null, category: editCategory })
        .eq('id', id);
      if (!error) {
        setEditingCardId(null);
        showToast('カードを更新しました', 'success');
        fetchCards();
      }
    } catch (e) { showToast('更新に失敗しました。', 'error'); }
  }

  async function handleDeleteCard(id: number) {
    if (!confirm('このカードを削除しますか？')) return;
    try {
      await supabase.from('cards').delete().eq('id', id);
      showToast('カードを削除しました', 'success');
      fetchCards();
    } catch (e) { showToast('削除に失敗しました。', 'error'); }
  }

  const uniqueCategories = Array.from(new Set(cards.map(c => c.category || 'General')));
  const masteredCards = cards.filter(c => c.interval > 1).length;
  const masterRate = cards.length > 0 ? Math.round((masteredCards / cards.length) * 100) : 0;

  // カラー定義
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';
  const headerClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const cardClass = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-sm';
  const inputBgClass = isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200';
  const subContainerClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs';
  const innerBoxClass = isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100';

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen text-xs font-bold tracking-widest ${isDark ? 'bg-slate-950 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
        LOADING...
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col justify-between antialiased transition-colors duration-300 ${bgClass}`}>
      
      {/* ヘッダー */}
      <header className={`px-6 py-4 border-b flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-xs relative z-50 ${headerClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={`text-base font-black tracking-wider flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              FLIP-N <span className="text-blue-500">PRO</span>
            </span>
            <div className={`text-[10px] font-mono tracking-wide px-2.5 py-0.5 rounded border flex items-center gap-1.5 ${isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{streak} DAYS</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <button onClick={handleLogout} className="text-[10px] font-mono border rounded px-2.5 py-1.5 hover:bg-red-500/10 hover:text-red-500 border-slate-700">LOGOUT</button>
            ) : (
              <div className="flex gap-1.5">
                <button onClick={() => setAuthMode('login')} className="text-[10px] font-mono border rounded px-2.5 py-1.5 bg-blue-600 text-white border-blue-600">SIGN IN</button>
              </div>
            )}

            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-lg transition-all border flex items-center justify-center ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider">
          <span className="text-blue-500 font-bold">LV.{level}</span>
          <span className="text-slate-400">|</span>
          <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{title}</span>
        </div>

        {/* ナビゲーション */}
        <nav className={`flex p-1 rounded-xl border overflow-x-auto ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-100 border-slate-200'}`}>
          {[
            { id: 'study', label: 'STUDY', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
            { id: 'test', label: 'TEST', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { id: 'manage', label: 'MANAGE', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { id: 'dashboard', label: 'ANALYTICS', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2zm12 0v-11a2 2 0 00-2-2h-2a2 2 0 00-2 2v11a2 2 0 002 2h2a2 2 0 002-2z" /></svg> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id ? (isDark ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600 shadow-xs') : (isDark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')}`}>
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* 🔐 認証モーダルポップアップ */}
      {authMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`p-6 rounded-2xl border max-w-sm w-full ${subContainerClass}`}>
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase mb-4 text-slate-400">{authMode === 'login' ? 'Sign In Pro Account' : 'Create Pro Account'}</h3>
            {/* ソーシャルログインボタン */}
            <div className="flex flex-col gap-2 mb-4">
              <button onClick={() => handleOAuthLogin('google')} className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
              <button onClick={() => handleOAuthLogin('github')} className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${isDark ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200'}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                Continue with GitHub
              </button>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
              <span className="text-[10px] font-mono text-slate-400">OR EMAIL</span>
              <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
            </div>
            <form onSubmit={handleAuth} className="flex flex-col gap-3">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={`p-2.5 border rounded-xl text-xs outline-none ${inputBgClass}`} required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={`p-2.5 border rounded-xl text-xs outline-none ${inputBgClass}`} required />
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs tracking-wider uppercase mt-1">{authMode === 'login' ? 'Login' : 'Register'}</button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-[10px] font-mono text-slate-400 hover:underline">
                {authMode === 'login' ? "DON'T HAVE AN ACCOUNT? SIGN UP" : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
              </button>
            </div>
            <button onClick={() => setAuthMode(null)} className="w-full text-[10px] font-mono text-slate-500 mt-4 tracking-widest">CANCEL</button>
          </div>
        </div>
      )}

      {/* 📚 コース選択モーダル */}
      {showCourseSelector && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`p-6 rounded-2xl border max-w-sm w-full text-center ${subContainerClass}`}>
            <h3 className="text-sm font-mono font-bold tracking-widest uppercase mb-2 text-blue-500">Welcome to Pro</h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">最初の学習コースを選択してください。</p>
            
            <div className="flex flex-col gap-3">
              <button onClick={() => handleSelectCourse('daily')} className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition hover:border-blue-500 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <span className="text-xl">☕️</span>
                <span className="text-xs font-bold">日常英会話スタートダッシュ</span>
              </button>
              <button onClick={() => handleSelectCourse('business')} className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition hover:border-blue-500 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <span className="text-xl">💼</span>
                <span className="text-xs font-bold">外資系ビジネス頻出ワード</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 未ログインユーザーへのバナー案内 */}
      {!user && (
        <div className="bg-blue-600/10 border-b border-blue-500/20 text-center py-2 text-[10px] font-mono font-bold tracking-wide text-blue-400 flex items-center justify-center gap-2">
          <span>💡 GUEST MODE: REGISTER AN ACCOUNT TO SAVE YOUR CUSTOM FLASHCARDS.</span>
        </div>
      )}

      {/* 1️⃣ STUDY MODE */}
      {activeTab === 'study' && (
        <main className="flex-1 flex flex-col items-center p-6 max-w-sm w-full mx-auto justify-center">
          <div className={`w-full flex flex-col gap-3 mb-6 p-2 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/40 border-slate-300/30'}`}>
            <div className="flex flex-col sm:flex-row gap-1.5 w-full">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={`w-full sm:w-auto text-[11px] rounded px-3 py-2 outline-none font-bold cursor-pointer border-none text-center tracking-wide ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 shadow-xs'}`}>
                <option value="All">ALL CATEGORIES</option>
                {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
              </select>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search word..." className={`flex-1 text-[11px] rounded px-4 py-2 outline-none border-none font-medium tracking-wide ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 shadow-xs'}`} />
            </div>
          </div>

          {displayCards.length === 0 ? (
            <div className={`w-full p-8 rounded-xl text-center border ${subContainerClass}`}><p className="text-xs text-slate-400 font-mono">NO CARDS FOUND</p></div>
          ) : currentIndex >= displayCards.length ? (
            <div className={`w-full p-8 rounded-xl text-center border ${subContainerClass}`}>
              <h2 className="text-xs font-mono font-bold tracking-widest mb-4">SECTION COMPLETED</h2>
              <button onClick={() => setCurrentIndex(0)} className="w-full bg-blue-600 text-white font-bold py-2 rounded text-xs tracking-wider">RESET</button>
            </div>
          ) : (
            <>
              <div className="w-full mb-2 flex justify-between text-[10px] font-mono text-slate-400 px-1">
                <span className={`px-2 py-0.5 rounded font-bold tracking-wide ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>{displayCards[currentIndex].category ? displayCards[currentIndex].category.toUpperCase() : 'GENERAL'}</span>
                <span>{currentIndex + 1} / {displayCards.length}</span>
              </div>

              {/* カード */}
              <div className="w-full h-52 flex items-center justify-center [perspective:1000px]">
                <motion.div 
                  className="w-full h-full relative cursor-grab [transform-style:preserve-3d]"
                  style={{ x, y, rotateX, rotateY }}
                  drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.05}
                  onTap={() => setIsFlipped(!isFlipped)}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <div className={`absolute inset-0 w-full h-full p-6 rounded-xl border flex flex-col items-center justify-center backface-visibility-hidden ${cardClass} ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
                    <h1 className="text-2xl font-bold tracking-wide">{displayCards[currentIndex].front}</h1>
                    <span className={`text-[9px] font-mono tracking-widest mt-6 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>DRAG OR TAP TO FLIP</span>
                  </div>
                  <div className={`absolute inset-0 w-full h-full p-6 rounded-xl border flex flex-col items-center justify-center [transform:rotateY(180deg)] backface-visibility-hidden ${cardClass} ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                    <h2 className="text-xl font-bold text-blue-500 mb-3 tracking-wide">{displayCards[currentIndex].back}</h2>
                    {displayCards[currentIndex].example && <p className={`text-[11px] p-2.5 rounded italic leading-relaxed ${isDark ? 'text-slate-400 bg-slate-950' : 'text-slate-600 bg-slate-50'}`}>"{displayCards[currentIndex].example}"</p>}
                  </div>
                </motion.div>
              </div>

              <div className={`w-full mt-4 p-3 rounded-xl flex items-center justify-between border ${subContainerClass}`}>
                <span className="text-[9px] font-mono text-slate-400 tracking-wider">PRONUNCIATION ANALYZER</span>
                <div className="flex gap-2">
                  <button onClick={startPronunciationAnalysis} className={`text-[10px] font-mono px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1 ${isRecording ? 'bg-red-600 text-white animate-pulse' : (isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200')}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    <span>{isRecording ? 'RECORDING' : 'REC'}</span>
                  </button>
                  <button onClick={() => speak(displayCards[currentIndex].front)} className={`text-[10px] font-mono px-2.5 py-1.5 rounded border flex items-center gap-1 ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    <span>TTS</span>
                  </button>
                </div>
                {pronunciationScore !== null && <span className="text-xs font-mono font-black text-green-500">{pronunciationScore}%</span>}
              </div>

              <div className="w-full mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => handleResponse(false)} className={`font-mono font-bold py-2.5 rounded text-[11px] tracking-widest border uppercase ${isDark ? 'bg-slate-900 border-slate-800 text-red-400' : 'bg-white border-slate-200 text-red-500 shadow-xs'}`}>AGAIN</button>
                <button onClick={() => handleResponse(true)} className="bg-blue-600 text-white font-mono font-bold py-2.5 rounded text-[11px] tracking-widest uppercase shadow-xs">GOOD</button>
              </div>
            </>
          )}
        </main>
      )}

      {/* 2️⃣ TEST MODE */}
      {activeTab === 'test' && (
        <main className="flex-1 flex flex-col items-center p-6 max-w-sm w-full mx-auto justify-center">
          {cards.length < 4 ? (
            <div className={`w-full p-6 rounded-xl text-center border ${subContainerClass}`}>
              <p className="text-[11px] font-mono text-slate-400 leading-relaxed">REQUIRES AT LEAST 4 CARDS REGISTERED TO START TEST MODE.</p>
            </div>
          ) : quizIndex >= cards.length ? (
            <div className={`w-full p-8 rounded-xl text-center border ${subContainerClass}`}>
              <h2 className="text-xs font-mono font-bold tracking-widest mb-1">TEST COMPLETED</h2>
              <p className="text-base font-mono font-bold text-blue-500 my-3">{quizScore} / {cards.length} CORRECT</p>
              <button onClick={startQuiz} className="w-full bg-blue-600 text-white font-bold py-2 rounded text-xs tracking-wider">RETRY</button>
            </div>
          ) : (
            <div className="w-full flex flex-col">
              <div className="mb-2 flex justify-between text-[10px] font-mono text-slate-400 px-1">
                <span>MULTIPLE CHOICE TEST</span>
                <span>{quizIndex + 1} / {cards.length}</span>
              </div>

              <div className={`w-full h-36 rounded-xl text-center mb-4 flex items-center justify-center border px-4 ${cardClass}`}>
                <h2 className="text-xl font-bold tracking-wide">{cards[quizIndex].front}</h2>
              </div>

              <div className="flex flex-col gap-2 w-full">
                {quizOptions.map((option, i) => {
                  const isSelected = quizSelected === option;
                  const isCorrect = option === cards[quizIndex].back;
                  
                  let btnStyle = isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-xs';
                  if (quizSelected) {
                    if (isCorrect) btnStyle = 'bg-green-500/10 border-green-500 text-green-500 font-bold';
                    else if (isSelected) btnStyle = 'bg-red-500/10 border-red-500 text-red-500';
                  }

                  return (
                    <button key={i} onClick={() => handleQuizAnswer(option)} disabled={quizSelected !== null} className={`w-full border text-left px-4 py-3 rounded-lg text-xs font-semibold transition flex justify-between items-center ${btnStyle}`}>
                      <span>{option}</span>
                      {quizSelected && isCorrect && <span className="text-green-500 font-mono text-[10px]">CORRECT</span>}
                      {quizSelected && isSelected && !isCorrect && <span className="text-red-500 font-mono text-[10px]">WRONG</span>}
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
          {!user ? (
            <div className={`p-6 rounded-xl border text-center ${subContainerClass}`}>
              <p className="text-xs text-slate-400 font-mono mb-4">YOU MUST BE LOGGED IN TO CREATE CUSTOM FLASHCARDS.</p>
              <button onClick={() => setAuthMode('login')} className="bg-blue-600 text-white font-bold text-xs py-2 px-4 rounded-xl">SIGN IN NOW</button>
            </div>
          ) : (
            <>
              <div className={`p-4 rounded-xl border mb-5 ${subContainerClass}`}>
                <h2 className="text-[10px] font-mono font-bold tracking-wider uppercase mb-3 text-slate-400">Add New Card</h2>
                <form onSubmit={handleAddCard} className="flex flex-col gap-2.5">
                  <input type="text" value={newFront} onChange={(e) => setNewFront(e.target.value)} placeholder="Word / Phrase" className={`w-full p-2.5 border rounded-lg text-xs outline-none focus:border-blue-500 font-medium ${inputBgClass}`} required />
                  <input type="text" value={newBack} onChange={(e) => setNewBack(e.target.value)} placeholder="Meaning" className={`w-full p-2.5 border rounded-lg text-xs outline-none focus:border-blue-500 font-medium ${inputBgClass}`} required />
                  <input type="text" value={newExample} onChange={(e) => setNewExample(e.target.value)} placeholder="Example sentence (optional)" className={`w-full p-2.5 border rounded-lg text-xs outline-none focus:border-blue-500 font-medium ${inputBgClass}`} />
                  <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category" className={`w-full p-2.5 border rounded-lg text-xs outline-none focus:border-blue-500 font-medium ${inputBgClass}`} />
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded text-xs mt-1 shadow-xs tracking-wider">SUBMIT</button>
                </form>
              </div>

              <div className={`p-4 rounded-xl border ${subContainerClass}`}>
                <h2 className="text-[10px] font-mono font-bold text-slate-400 mb-3 uppercase tracking-wider">Registered Cards ({cards.length})</h2>
                <div className="flex flex-col gap-2">
                  {cards.map((card) => (
                    <div key={card.id} className={`p-3 border rounded-lg flex flex-col gap-2 ${innerBoxClass}`}>
                      {editingCardId === card.id ? (
                        <div className="flex flex-col gap-2">
                          <input type="text" value={editFront} onChange={(e) => setEditFront(e.target.value)} className={`p-2 border rounded text-xs ${inputBgClass}`} />
                          <input type="text" value={editBack} onChange={(e) => setEditBack(e.target.value)} className={`p-2 border rounded text-xs ${inputBgClass}`} />
                          <input type="text" value={editExample} onChange={(e) => setEditExample(e.target.value)} className={`p-2 border rounded text-xs ${inputBgClass}`} />
                          <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={`p-2 border rounded text-xs ${inputBgClass}`} />
                          <div className="flex gap-2 justify-end mt-1 text-[10px] font-mono">
                            <button type="button" onClick={() => setEditingCardId(null)} className="text-slate-400 font-bold py-1 px-2">CANCEL</button>
                            <button type="button" onClick={() => handleUpdateCard(card.id)} className="bg-blue-600 text-white py-1 px-3 rounded font-bold shadow-xs">SAVE</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs">{card.front}</span>
                              <span className={`text-[8px] font-mono tracking-wide px-1.5 py-0.5 rounded font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>{card.category ? card.category.toUpperCase() : 'GENERAL'}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 font-medium">{card.back}</div>
                          </div>
                          <div className="flex gap-2 text-[10px] font-mono text-slate-400">
                            <button onClick={() => startEditing(card)} className="hover:text-blue-500 p-1">EDIT</button>
                            <button onClick={() => handleDeleteCard(card.id)} className="hover:text-red-500 p-1">DEL</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      )}

      {/* 4️⃣ ANALYTICS DASHBOARD */}
      {activeTab === 'dashboard' && (
        <main className="flex-1 max-w-sm w-full mx-auto p-6 flex flex-col gap-4 justify-center">
          
          {/* PWA通知有効化セクション */}
          <div className={`p-4 rounded-xl text-center border ${subContainerClass}`}>
            <h2 className="text-[10px] font-mono font-bold text-slate-400 mb-2 tracking-widest uppercase">Push Notifications</h2>
            <button onClick={triggerTestNotification} className="w-full bg-slate-800 text-blue-400 border border-blue-500/30 font-bold py-2.5 rounded-xl text-xs tracking-wider flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              ENABLE NOTIFICATIONS
            </button>
          </div>

          <div className={`p-5 rounded-xl text-center border ${subContainerClass}`}>
            <h2 className="text-[10px] font-mono font-bold text-slate-400 mb-4 tracking-widest uppercase">Leaderboard Rankings</h2>
            <div className="flex flex-col gap-1.5 font-mono text-xs">
              {[ {rank: 1, name: user ? `YOU (${user.email.split('@')[0].toUpperCase()})` : 'GUEST USER', score: cards.length, isUser: true}, {rank: 2, name: 'AI_STUDENT', score: cards.length > 2 ? cards.length - 1 : 12, isUser: false}, {rank: 3, name: 'SAMPLE_USER', score: cards.length > 3 ? cards.length - 2 : 5, isUser: false} ].map((u, i) => (
                <div key={i} className={`p-2 rounded flex items-center justify-between font-bold ${u.isUser ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black">0{u.rank}</span>
                    <span className="tracking-wide">{u.name}</span>
                  </div>
                  <span>{u.score} CARDS</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className={`p-5 rounded-xl text-center border ${subContainerClass}`}>
            <h2 className="text-[10px] font-mono font-bold text-slate-400 mb-5 tracking-widest uppercase">Learning Progress Tree</h2>
            <div className="text-center mb-6">
              <span className="text-3xl font-black text-blue-500 font-mono">{masterRate}%</span>
              <span className="text-[9px] text-slate-400 block font-mono font-bold mt-1 tracking-widest">RETENTION PATH COMPLETED</span>
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-left">
              <div className={`p-3 rounded border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[9px] text-slate-400 block mb-0.5 font-bold uppercase tracking-wider">Total Cards</span>
                <span className="text-xs font-bold">{cards.length}</span>
              </div>
              <div className={`p-3 rounded border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[9px] text-slate-400 block mb-0.5 font-bold uppercase tracking-wider">Mastered</span>
                <span className="text-xs font-bold text-green-500">{masteredCards}</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* フッター */}
      <footer className={`py-4 text-center text-[9px] border-t font-mono font-bold tracking-widest ${isDark ? 'bg-slate-900 border-slate-800 text-slate-600' : 'bg-white border-slate-200 text-slate-400'}`}>
        FLIP-N ULTIMATE // POWERED BY NOBUHIRO SYSTEM
      </footer>

      {/* 🍞 トースト通知UI */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-mono font-bold tracking-wide shadow-xl max-w-xs w-full justify-center transition-all ${
            toastType === 'error' 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
              : toastType === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}
        >
          {toastType === 'error' && <span>⚠️</span>}
          {toastType === 'success' && <span>✅</span>}
          {toastType === 'info' && <span>💡</span>}
          <span>{toastMessage.toUpperCase()}</span>
        </motion.div>
      )}

    </div>
  );
}