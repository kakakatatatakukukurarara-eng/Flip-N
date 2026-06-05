"use client";

import confetti from 'canvas-confetti';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { createWorker } from 'tesseract.js';

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
  efactor?: number;
  repetition?: number;
  is_public: boolean;
}

interface PreviewCard {
  front: string;
  back: string;
  example: string;
  category: string;
}

const COURSE_PRESETS = {
  daily: [
    { front: "It's up to you.", back: "あなた次第です。", example: "Where should we eat? It's up to you.", category: "Daily", is_public: false },
    { front: "I'm on my way.", back: "今向かっています。", example: "Sorry I'm late, I'm on my way.", category: "Daily", is_public: false },
    { front: "Make sense?", back: "意味わかる？（理解できた？）", example: "So we need to finish this by Friday. Make sense?", category: "Daily", is_public: false },
  ],
  business: [
    { front: "ASAP", back: "できるだけ早く", example: "Please send me the report ASAP.", category: "Business", is_public: false },
    { front: "FYI", back: "ご参考までに", example: "FYI, the meeting is postponed.", category: "Business", is_public: false },
    { front: "Align", back: "すり合わせる・連携する", example: "We need to align on the project goals.", category: "Business", is_public: false },
  ]
};

export default function UltimateStudyExperience() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);

  const [cards, setCards] = useState<Card[]>([]);
  const [sharedCards, setSharedCards] = useState<Card[]>([]);
  const [displayCards, setDisplayCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'study' | 'test' | 'manage' | 'shared' | 'dashboard'>('study');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [title, setTitle] = useState('BEGINNER');

  const [isRecording, setIsRecording] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const [showCourseSelector, setShowCourseSelector] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  const [isFlipped, setIsFlipped] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);

  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const frontInputRef = useRef<HTMLInputElement>(null);

  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [editExample, setEditExample] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);

  const [aiText, setAiText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPreviewCards, setAiPreviewCards] = useState<PreviewCard[]>([]);

  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playSound = (type: 'correct' | 'wrong') => {
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
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    showToast("⏳ 画像をスキャンして文字を抽出中...", "info");

    try {
      // ユーザーのデバイス（スマホやPC）の頭脳を使って、その場で英語を読み取る
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      if (!text || text.trim().length < 3) {
        showToast("文字を検出できませんでした。はっきり写してください。", "error");
        setIsProcessingImage(false);
        return;
      }

      showToast("📝 英語の抽出に成功！AI単語カードを生成中...", "info");

      // 💡 すでにFLIP-Nにある既存の「/api/generate」にテキストをそのまま流し込む！
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          category: selectedCategory !== 'All' ? selectedCategory : 'Camera Scan' // ⭕ selectedCategory に修正
        }),
      });

      if (!response.ok) throw new Error("単語カードの生成に失敗しました");

      const data = await response.json();

      if (data.cards && data.cards.length > 0) {
        setAiPreviewCards(data.cards);
        showToast(`📸 ${data.cards.length}個の単語をカメラから保存しました！`, "success");
      } else {
        showToast("辞書にマッチする単語がありませんでした。", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("❌ カメラ画像の解析に失敗しました", "error");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  }

  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registered:', reg))
        .catch((err) => console.error('Service Worker failed:', err));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchCards();
    fetchSharedCards();
  }, [user, activeTab]);

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
        .eq('user_id', user.id)
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

  async function fetchSharedCards() {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('cards')
        .select('*')
        .eq('is_public', true)
        .neq('user_id', user.id);
      if (data) setSharedCards(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleImportCard(sharedCard: Card) {
    if (!user) return;
    try {
      const { error } = await supabase.from('cards').insert([
        {
          front: sharedCard.front,
          back: sharedCard.back,
          example: sharedCard.example,
          category: sharedCard.category || 'Imported',
          user_id: user.id,
          interval: 1,
          is_public: false
        }
      ]);
      if (!error) {
        showToast('カードを自分の単語帳に保存しました！', 'success');
        fetchCards();
        fetchSharedCards();
        confetti({ particleCount: 40, spread: 40 });
      } else {
        showToast('インポートに失敗しました。', 'error');
      }
    } catch (e) {
      showToast('エラーが発生しました。', 'error');
    }
  }

  async function handleResponse(quality: number) {
    if (!displayCards || displayCards.length === 0) return;
    const currentCard = displayCards[currentIndex];
    if (!currentCard) return;

    if (!user) {
      setIsFlipped(false);
      setTimeout(() => { setCurrentIndex((prev) => prev + 1); }, 200);
      return;
    }

    let interval = currentCard.interval || 1;
    let efactor = currentCard.efactor || 2.5;
    let repetition = currentCard.repetition || 0;

    if (quality >= 3) {
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * efactor);
      }
      repetition += 1;
    } else {
      repetition = 0;
      interval = 1;
    }

    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) efactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    try {
      await supabase
        .from('cards')
        .update({
          interval,
          efactor,
          repetition,
          next_review_at: nextReviewDate.toISOString()
        })
        .eq('id', currentCard.id);
    } catch (e) {
      console.error(e);
    }

    setIsFlipped(false);
    setTimeout(() => { setCurrentIndex((prev) => prev + 1); }, 200);
  }

  useEffect(() => {
    if (activeTab !== 'study' || displayCards.length === 0 || currentIndex >= displayCards.length) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        handleResponse(5);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        handleResponse(3);
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        handleResponse(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, currentIndex, displayCards]);

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
      showToast('通知がブロックされています。', 'error');
    }
  }

  async function handleGenerateAI() {
    if (!user) { showToast('カードを生成するにはログインが必要です。', 'info'); return; }
    if (!aiText.trim()) { showToast('テキストを入力してください。', 'error'); return; }

    setIsGenerating(true);
    showToast('✨ AIが解析中...', 'info');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText, category: 'AI Generated' })
      });
      const data = await res.json();

      if (data.cards && Array.isArray(data.cards)) {
        const formatted: PreviewCard[] = data.cards.map((c: any) => ({
          front: c.front || '',
          back: c.back || '',
          example: c.example || '',
          category: c.category || 'AI Generated'
        }));
        setAiPreviewCards(formatted);
        showToast('✨ プレビュー画面が出現しました！', 'success');
      } else {
        showToast('生成処理が失敗しました。', 'error');
      }
    } catch (e) {
      showToast('エラーが発生しました。', 'error');
    } finally {
      setIsGenerating(false);
    }
  }

  const handleUpdatePreviewField = (index: number, field: keyof PreviewCard, value: string) => {
    const updated = [...aiPreviewCards];
    updated[index][field] = value;
    setAiPreviewCards(updated);
  };

  const handleExcludePreviewCard = (index: number) => {
    setAiPreviewCards(prev => prev.filter((_, i) => i !== index));
    showToast('カードを除外しました', 'info');
  };

  async function handleConfirmAndSaveAI() {
    if (aiPreviewCards.length === 0) return;
    showToast('🚀 データベースへ一発保存中...', 'info');

    const cardsToInsert = aiPreviewCards.map(c => ({
      front: c.front.trim(),
      back: c.back.trim(),
      example: c.example.trim() || null,
      category: c.category.trim() || 'AI Generated',
      user_id: user.id,
      interval: 1,
      is_public: false
    }));

    try {
      const { error } = await supabase.from('cards').insert(cardsToInsert);
      if (!error) {
        showToast(`✅ ${cardsToInsert.length}枚のカードを保存しました！`, 'success');
        setAiPreviewCards([]);
        setAiText('');
        fetchCards();
        setTimeout(() => confetti({ particleCount: 100, spread: 60 }), 300);
      } else {
        showToast('データベースへの保存に失敗しました。', 'error');
      }
    } catch (e) {
      showToast('保存エラーが発生しました。', 'error');
    }
  }

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
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme as any);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('user_theme', nextTheme);
  };

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

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    let redirectUrl = 'https://flip-n.vercel.app';
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      if (host.includes('localhost') || host.includes('github.dev')) {
        redirectUrl = `${window.location.protocol}//${host}`;
      }
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl }
    });
    if (error) showToast(error.message, 'error');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast('ログアウトしました', 'info');
    setActiveTab('study');
  };

  useEffect(() => {
    const totalMastered = cards.filter(c => (c.interval || 0) > 1).length;
    const newLevel = Math.floor(totalMastered / 5) + 1;
    setLevel(newLevel);
    if (newLevel >= 10) setTitle('MASTER');
    else if (newLevel >= 5) setTitle('EXPERT');
    else if (newLevel >= 3) setTitle('ADVANCED');
    else setTitle('BEGINNER');
  }, [cards]);

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

  function speak(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = /^[A-Za-z0-9\s,.:?!'"-]+$/.test(text) ? 'en-US' : 'ja-JP';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

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
      playSound('correct');
      vibrate(50);
      if (quizIndex + 1 === cards.length && quizScore + 1 === cards.length) {
        setTimeout(() => confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }), 500);
      }
    } else {
      playSound('wrong');
      vibrate([50, 100, 50]);
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

  function startPronunciationAnalysis() {
    if (!('webkitSpeechRecognition' in window)) {
      showToast('音声認識未対応ブラウザです。', 'info');
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
        setPronunciationScore(Math.floor(Math.random() * 10) + 90);
        speak('Excellent!');
      } else {
        setPronunciationScore(Math.floor(Math.random() * 20) + 60);
        speak('Try again.');
      }
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  }

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { showToast('カードを追加するにはログインが必要です。', 'info'); return; }

    const trimmedFront = newFront.trim();
    const trimmedBack = newBack.trim();
    if (!trimmedFront || !trimmedBack) return;

    try {
      const { error } = await supabase.from('cards').insert([
        {
          front: trimmedFront,
          back: trimmedBack,
          example: newExample.trim() || null,
          category: newCategory.trim() || 'General',
          user_id: user.id,
          is_public: newIsPublic
        }
      ]);
      if (!error) {
        setNewFront('');
        setNewBack('');
        setNewExample('');
        setNewIsPublic(false);
        showToast('カードを追加しました', 'success');
        fetchCards();
        frontInputRef.current?.focus();
      }
    } catch (e) { showToast('追加に失敗しました。', 'error'); }
  }

  function startEditing(card: Card) {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditExample(card.example || '');
    setEditCategory(card.category || 'General');
    setEditIsPublic(card.is_public || false);
  }

  async function handleUpdateCard(id: number) {
    try {
      const { error } = await supabase
        .from('cards')
        .update({
          front: editFront.trim(),
          back: editBack.trim(),
          example: editExample.trim() || null,
          category: editCategory.trim(),
          is_public: editIsPublic
        })
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

  // データベースの is_public フラグを反転させる関数
  async function toggleCardPublic(cardId: number, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('cards')
        .update({ is_public: !currentStatus })
        .eq('id', cardId);

      if (!error) {
        showToast(!currentStatus ? 'カードを一般公開しました！' : 'カードを非公開にしました', 'success');
        fetchCards(); // 自分のカードリストを再更新
      } else {
        showToast('設定の変更に失敗しました。', 'error');
      }
    } catch (e) {
      showToast('エラーが発生しました。', 'error');
    }
  }

  const uniqueCategories = Array.from(new Set(cards.map(c => c.category || 'General')));
  const masteredCards = cards.filter(c => (c.interval || 0) > 1).length;
  const masterRate = cards.length > 0 ? Math.round((masteredCards / cards.length) * 100) : 0;

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
        <div className="flex items-center justify-between w-full md:w-auto">
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

          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <button onClick={handleLogout} className="text-[10px] font-mono border rounded px-2.5 py-1.5 hover:bg-red-500/10 hover:text-red-500 border-slate-700">LOGOUT</button>
            ) : (
              <button onClick={() => setAuthMode('login')} className="text-[10px] font-mono border rounded px-2.5 py-1.5 bg-blue-600 text-white border-blue-600">SIGN IN</button>
            )}
            <button onClick={toggleTheme} className={`p-2 rounded-lg border flex items-center justify-center ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-100 border-slate-220 text-slate-600'}`}>
              {isDark ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[10px] font-mono tracking-wider">
          <span className="text-blue-500 font-bold">LV.{level}</span>
          <span className="text-slate-400">|</span>
          <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{title}</span>
        </div>

        {/* ナビゲーション */}
        <div className="flex items-center justify-between gap-4 w-full md:w-auto">
          <nav className={`flex p-1 rounded-xl border overflow-x-auto ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-100 border-slate-200'}`}>
            {[
              { id: 'study', label: 'STUDY', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
              { id: 'test', label: 'TEST', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              { id: 'manage', label: 'MANAGE', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              { id: 'shared', label: 'SHARED', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg> },
              { id: 'dashboard', label: 'ANALYTICS', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2zm12 0v-11a2 2 0 00-2-2h-2a2 2 0 00-2 2v11a2 2 0 002 2h2a2 2 0 002-2z" /></svg> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id ? (isDark ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600 shadow-xs') : (isDark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <button onClick={handleLogout} className="text-[10px] font-mono border rounded px-2.5 py-1.5 hover:bg-red-500/10 hover:text-red-500 border-slate-700">LOGOUT</button>
            ) : (
              <button onClick={() => setAuthMode('login')} className="text-[10px] font-mono border rounded px-2.5 py-1.5 bg-blue-600 text-white border-blue-600">SIGN IN</button>
            )}
            <button onClick={toggleTheme} className={`p-2 rounded-lg border flex items-center justify-center ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
              {isDark ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
          </div>
        </div>
      </header>

      {/* 🔐 認証モーダル */}
      {authMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`p-6 rounded-2xl border max-w-sm w-full ${subContainerClass}`}>
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase mb-4 text-slate-400">{authMode === 'login' ? 'Sign In Pro Account' : 'Create Pro Account'}</h3>

            <div className="flex flex-col gap-2 mb-4">
              <button onClick={() => handleOAuthLogin('google')} className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border bg-white text-black hover:bg-slate-200 transition">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" /></svg>
                Continue with Google
              </button>
              <button onClick={() => handleOAuthLogin('github')} className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border bg-[#24292e] text-white hover:bg-[#1a1e22] transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.008.069-.008 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" /></svg>
                Continue with GitHub
              </button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono text-slate-500">OR EMAIL</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <form onSubmit={handleAuth} className="space-y-3 mt-2">
              <div>
                <label className="block text-[9px] font-mono font-bold text-slate-400 mb-1">EMAIL ADDRESS</label>
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden focus:ring-1 focus:ring-blue-500 ${inputBgClass}`} />
              </div>
              <div>
                <label className="block text-[9px] font-mono font-bold text-slate-400 mb-1">PASSWORD</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden focus:ring-1 focus:ring-blue-500 ${inputBgClass}`} />
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider transition uppercase shadow-lg shadow-blue-600/20">
                {authMode === 'login' ? 'SIGN IN' : 'SIGN UP'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-[10px] font-mono font-bold text-blue-500 hover:underline">
                {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
            <button onClick={() => setAuthMode(null)} className="mt-2 w-full text-center text-[10px] font-mono text-slate-500 hover:text-slate-300 py-1">CANCEL</button>
          </div>
        </div>
      )}

      {/* 🍏 コース選択モーダル */}
      {showCourseSelector && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`p-6 rounded-2xl border max-w-md w-full ${subContainerClass}`}>
            <div className="text-center mb-6">
              <span className="text-xs font-mono font-bold text-blue-500 tracking-widest uppercase block mb-1">Welcome to FLIP-N</span>
              <h3 className="text-base font-black tracking-tight">初期プリセットを選択してください</h3>
              <p className="text-[11px] text-slate-400 mt-1">いつでもカードの追加・削除・編集が可能です。</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => handleSelectCourse('daily')} className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.01] ${cardClass} hover:border-blue-500/50 group`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold tracking-wide group-hover:text-blue-400 transition">日常英会話コース</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-sm font-bold border border-blue-500/20">DAILY</span>
                </div>
                <p className="text-[11px] text-slate-400">"It's up to you" や "Make sense?" など、明日からすぐに使えるリアルな日常フレーズを集めた初心者向けパック。</p>
              </button>
              <button onClick={() => handleSelectCourse('business')} className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.01] ${cardClass} hover:border-purple-500/50 group`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold tracking-wide group-hover:text-purple-400 transition">ビジネス英語コース</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-sm font-bold border border-purple-500/20">BUSINESS</span>
                </div>
                <p className="text-[11px] text-slate-400">"ASAP" などの頻出略語から、"Align(すり合わせる)" といったミーティングや現場で必須となるプロ向け実践パック。</p>
              </button>
            </div>
            <button onClick={() => setShowCourseSelector(false)} className="mt-4 w-full text-center text-[10px] font-mono text-slate-500 hover:text-slate-300 py-1">スキップして空の単語帳を作る</button>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      {activeTab === 'study' && (
        <main className="flex-grow flex flex-col items-center justify-center p-6 max-w-lg w-full mx-auto relative z-10">

          {/* カテゴリフィルター & 検索 */}
          <div className="w-full flex gap-2 mb-4 items-center">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`text-[11px] font-mono font-bold tracking-wide px-2.5 py-2 rounded-xl border focus:outline-hidden ${inputBgClass}`}
            >
              <option value="All">ALL CATEGORIES</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
              ))}
            </select>
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search word..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 rounded-xl text-[11px] font-mono border focus:outline-hidden ${inputBgClass}`}
              />
              <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {displayCards.length === 0 ? (
            <div className={`w-full p-12 text-center rounded-2xl border font-mono text-[11px] tracking-widest font-bold ${subContainerClass}`}>
              NO CARDS FOUND
            </div>
          ) : currentIndex >= displayCards.length ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`w-full p-8 text-center rounded-2xl border ${subContainerClass}`}>
              <div className="w-12 h-12 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h4 className="text-sm font-black tracking-tight mb-1">本日の学習がすべて完了しました！</h4>
              <p className="text-[11px] text-slate-400 font-mono mb-4">GREAT JOB! YOU RETAINED {displayCards.length} CARDS.</p>
              <button onClick={() => setCurrentIndex(0)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[11px] font-mono font-bold border border-slate-700 transition">REVIEW AGAIN</button>
            </motion.div>
          ) : (
            <div className="w-full space-y-4">

              {/* 進捗バー */}
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 px-1">
                <span>CARD {currentIndex + 1} OF {displayCards.length}</span>
                <span>{Math.round(((currentIndex) / displayCards.length) * 100)}% DONE</span>
              </div>
              <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-200'}`}>
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${((currentIndex) / displayCards.length) * 100}%` }}></div>
              </div>

              {/* フラッシュカード本体 */}
              <div
                className="relative h-72 w-full cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
                style={{ perspective: "1000px" }}
              >
                <motion.div
                  style={{ x, y, rotateX, rotateY, transformStyle: "preserve-3d" }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="w-full h-full relative"
                >

                  {/* カード前面 (表面) */}
                  <div
                    className={`absolute inset-0 w-full h-full rounded-2xl border p-6 flex flex-col justify-between shadow-xl transition-colors duration-300 ${cardClass}`}
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-blue-500 uppercase px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                        {displayCards[currentIndex].category || 'GENERAL'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {displayCards[currentIndex].is_public && (
                          <span className="text-[9px] font-mono text-green-500 font-bold bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded">SHARED</span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); speak(displayCards[currentIndex].front); }}
                          className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="text-center py-4">
                      <h2 className="text-xl font-black tracking-tight leading-snug">{displayCards[currentIndex].front}</h2>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase animate-pulse">TAP TO FLIP</span>
                    </div>
                  </div>

                  {/* カード背面 (裏面) */}
                  <div
                    className={`absolute inset-0 w-full h-full rounded-2xl border p-6 flex flex-col justify-between shadow-xl transition-colors duration-300 ${cardClass}`}
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-purple-500 uppercase px-2 py-0.5 bg-purple-500/10 rounded border border-purple-500/20">ANSWER</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); speak(displayCards[currentIndex].back); }}
                        className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                      </button>
                    </div>
                    <div className="text-center py-2 px-4 space-y-2">
                      <h3 className="text-base font-bold text-blue-400">{displayCards[currentIndex].back}</h3>
                      {displayCards[currentIndex].example && (
                        <p className="text-[11px] text-slate-400 italic leading-relaxed bg-slate-950/30 p-2 rounded-lg border border-slate-800/40">{displayCards[currentIndex].example}</p>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase">TAP TO SHOW FRONT</span>
                    </div>
                  </div>

                </motion.div>
              </div>

              {/* 🎤 発音分析セクション */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${subContainerClass}`}>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={startPronunciationAnalysis}
                    disabled={isRecording}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border transition ${isRecording ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-600 shadow-sm'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold tracking-wide">PRONUNCIATION ANALYZER</span>
                    <span className="text-[9px] text-slate-400">{isRecording ? 'Listening...' : 'Tap mic and read aloud the English word'}</span>
                  </div>
                </div>
                {pronunciationScore !== null && (
                  <div className="text-right">
                    <span className={`text-xs font-mono font-black ${pronunciationScore >= 80 ? 'text-green-400' : 'text-orange-400'}`}>{pronunciationScore}点</span>
                  </div>
                )}
              </div>

              {/* 反復クオリティ選択ボタン */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => handleResponse(0)}
                  className="flex flex-col items-center justify-center p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition group"
                >
                  <span className="text-xs font-black tracking-wide">AGAIN</span>
                  <span className="text-[8px] font-mono text-red-500/70 mt-0.5 group-hover:text-red-400 transition">Forgot (1d)</span>
                </button>
                <button
                  onClick={() => handleResponse(3)}
                  className="flex flex-col items-center justify-center p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl transition group"
                >
                  <span className="text-xs font-black tracking-wide">GOOD</span>
                  <span className="text-[8px] font-mono text-blue-500/70 mt-0.5 group-hover:text-blue-400 transition">Normal (Interval × EF)</span>
                </button>
                <button
                  onClick={() => handleResponse(5)}
                  className="flex flex-col items-center justify-center p-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl transition group"
                >
                  <span className="text-xs font-black tracking-wide">EASY</span>
                  <span className="text-[8px] font-mono text-green-500/70 mt-0.5 group-hover:text-green-400 transition">Perfect (Interval × EF × 1.3)</span>
                </button>
              </div>

              {/* キーボードショートカットヘルプ */}
              <div className="text-center text-[9px] font-mono text-slate-500 flex items-center justify-center gap-3 pt-1">
                <span>[Space] Flip</span>
                <span>[←] Again</span>
                <span>[↑] Good</span>
                <span>[→] Easy</span>
              </div>

            </div>
          )}
        </main>
      )}

      {/* 📝 テスト (4択クイズ) */}
      {activeTab === 'test' && (
        <main className="flex-grow flex flex-col items-center justify-center p-6 max-w-md w-full mx-auto relative z-10">
          {cards.length < 4 ? (
            <div className={`w-full p-8 text-center rounded-2xl border font-mono text-[11px] tracking-wide font-bold ${subContainerClass}`}>
              クイズを開始するには最低4枚のカードが必要です。
            </div>
          ) : quizIndex >= cards.length ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`w-full p-6 text-center rounded-2xl border ${subContainerClass}`}>
              <span className="text-2xl block mb-2">🏆</span>
              <h4 className="text-sm font-black tracking-tight mb-1">テスト完了！</h4>
              <p className="text-xs font-mono text-blue-500 font-bold mb-4">SCORE: {quizScore} / {cards.length}</p>
              <button onClick={startQuiz} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-mono font-bold shadow-lg shadow-blue-600/20 transition">TRY AGAIN</button>
            </motion.div>
          ) : (
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500 px-1">
                <span>QUIZ {quizIndex + 1} OF {cards.length}</span>
                <span>SCORE: {quizScore}</span>
              </div>

              <div className={`p-6 rounded-2xl border text-center ${cardClass}`}>
                <span className="text-[9px] font-mono font-bold tracking-widest text-blue-500 uppercase px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20 block w-max mx-auto mb-3">QUESTION</span>
                <h3 className="text-base font-black tracking-tight">{cards[quizIndex].front}</h3>
              </div>

              <div className="flex flex-col gap-2">
                {quizOptions.map((option, idx) => {
                  const isSelected = quizSelected === option;
                  const isCorrect = option === cards[quizIndex].back;
                  let btnStyle = isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs';

                  if (quizSelected) {
                    if (isCorrect) btnStyle = 'bg-green-500/20 border-green-500 text-green-400 font-bold';
                    else if (isSelected) btnStyle = 'bg-red-500/20 border-red-500 text-red-400 font-bold';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(option)}
                      className={`w-full p-3 rounded-xl border text-left text-xs transition flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{option}</span>
                      {quizSelected && isCorrect && <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      {quizSelected && isSelected && !isCorrect && <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      )}

      {/* 📂 単語帳管理タブ */}
      {activeTab === 'manage' && (
        <main className="flex-grow p-6 max-w-4xl w-full mx-auto space-y-6 relative z-10">

          {/* AI生成機能 */}
          <div className={`p-5 rounded-2xl border ${subContainerClass}`}>
            <h4 className="text-xs font-mono font-bold tracking-widest text-blue-500 uppercase mb-1">✨ AI Flashcard Generator</h4>
            <p className="text-[11px] text-slate-400 mb-3">長文や単語リストを入力すると、AIが自動で「英語・日本語・例文」のカードを一度に解析して生成します。</p>
            <div className="flex flex-col gap-2">
              <textarea
                placeholder="ここに英文や単語リストを入力... (例: Apple, Banana, Horizon)"
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                disabled={isGenerating}
                rows={3}
                className={`w-full p-3 rounded-xl text-xs font-mono border focus:outline-hidden focus:ring-1 focus:ring-blue-500 ${inputBgClass}`}
              />
              {/* 隠しカメラインプット（スマホならカメラ起動、PCならファイル選択） */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment" // スマホの背面カメラを直接起動させる
                className="hidden"
                onChange={handleImageChange}
              />

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage || isGenerating}
                  className="w-full py-3 px-4 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none group"
                >
                  {isProcessingImage ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                      <span>OCR SCANNING IN PROGRESS...</span>
                    </>
                  ) : (
                    <>
                      <span className="group-hover:rotate-12 transition-transform">📸</span>
                      <span>AI CAMERA SCAN</span>
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-mono font-bold text-xs tracking-wider rounded-xl transition uppercase shadow-md"
              >
                {isGenerating ? 'AI 解析中...' : 'AIで一発自動生成する'}
              </button>
            </div>

            {/* AIプレビュー確認エリア */}
            {aiPreviewCards.length > 0 && (
              <div className="mt-5 pt-4 border-t border-dashed border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-[11px] font-mono font-bold text-yellow-500 tracking-wider uppercase">✨ AI Generation Preview ({aiPreviewCards.length}枚)</h5>
                  <button onClick={handleConfirmAndSaveAI} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white font-mono font-bold text-[10px] tracking-wide rounded-lg transition shadow-xs">
                    この内容で確定・保存する
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {aiPreviewCards.map((pCard, index) => (
                    <div key={index} className={`p-3 rounded-xl border relative flex flex-col gap-1.5 group ${innerBoxClass}`}>
                      <button
                        onClick={() => handleExcludePreviewCard(index)}
                        className="absolute top-2 right-2 p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition"
                        title="除外する"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                      <div>
                        <label className="block text-[8px] font-mono text-slate-500">FRONT (ENGLISH)</label>
                        <input type="text" value={pCard.front} onChange={(e) => handleUpdatePreviewField(index, 'front', e.target.value)} className="w-full bg-transparent border-b border-slate-800 text-xs font-bold text-slate-200 py-0.5 focus:outline-hidden focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-mono text-slate-500">BACK (JAPANESE)</label>
                        <input type="text" value={pCard.back} onChange={(e) => handleUpdatePreviewField(index, 'back', e.target.value)} className="w-full bg-transparent border-b border-slate-800 text-xs text-blue-400 py-0.5 focus:outline-hidden focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-mono text-slate-500">EXAMPLE SENTENCE</label>
                        <input type="text" value={pCard.example} onChange={(e) => handleUpdatePreviewField(index, 'example', e.target.value)} className="w-full bg-transparent border-b border-slate-800 text-[10px] text-slate-400 py-0.5 focus:outline-hidden focus:border-blue-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* 新規カード追加フォーム */}
            <div className={`p-5 rounded-2xl border h-max ${subContainerClass}`}>
              <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase mb-4">Add New Card</h4>
              <form onSubmit={handleAddCard} className="space-y-3">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-slate-500 mb-1">FRONT (ENGLISH)</label>
                  <input ref={frontInputRef} type="text" placeholder="English word / phrase" value={newFront} onChange={(e) => setNewFront(e.target.value)} required className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${inputBgClass}`} />
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-slate-500 mb-1">BACK (JAPANESE)</label>
                  <input type="text" placeholder="日本語の意味" value={newBack} onChange={(e) => setNewBack(e.target.value)} required className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden ${inputBgClass}`} />
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-slate-500 mb-1">EXAMPLE (OPTIONAL)</label>
                  <input type="text" placeholder="Context sentence" value={newExample} onChange={(e) => setNewExample(e.target.value)} className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden ${inputBgClass}`} />
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-slate-500 mb-1">CATEGORY</label>
                  <input type="text" placeholder="General, Business, Daily etc." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${inputBgClass}`} />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="newIsPublic" checked={newIsPublic} onChange={(e) => setNewIsPublic(e.target.checked)} className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 w-3.5 h-3.5" />
                  <label htmlFor="newIsPublic" className="text-[10px] font-mono font-bold text-slate-400 cursor-pointer">全体に公開する (SHAREDタブへ表示)</label>
                </div>
                <button type="submit" className="w-full py-2 bg-slate-100 hover:bg-white text-slate-900 font-mono font-bold text-xs tracking-wider rounded-xl transition uppercase shadow-xs">ADD TO DECK</button>
              </form>
            </div>

            {/* カード一覧・編集リスト */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase px-1">Deck Cards ({cards.length})</h4>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {cards.map(card => (
                  <div key={card.id} className={`p-4 rounded-2xl border transition ${cardClass}`}>
                    {editingCardId === card.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={editFront} onChange={(e) => setEditFront(e.target.value)} className={`px-2 py-1.5 rounded-lg text-xs font-mono border ${inputBgClass}`} />
                          <input type="text" value={editBack} onChange={(e) => setEditBack(e.target.value)} className={`px-2 py-1.5 rounded-lg text-xs border ${inputBgClass}`} />
                        </div>
                        <input type="text" placeholder="Example sentence" value={editExample} onChange={(e) => setEditExample(e.target.value)} className={`w-full px-2 py-1.5 rounded-lg text-xs border ${inputBgClass}`} />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-4">
                            <input type="text" placeholder="Category" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={`px-2 py-1 rounded-lg text-[11px] font-mono border max-w-[140px] ${inputBgClass}`} />
                            <div className="flex items-center gap-1.5">
                              <input type="checkbox" id={`editIsPublic-${card.id}`} checked={editIsPublic} onChange={(e) => setEditIsPublic(e.target.checked)} className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 w-3.5 h-3.5" />
                              <label htmlFor={`editIsPublic-${card.id}`} className="text-[10px] font-mono text-slate-400 cursor-pointer">全体公開</label>
                            </div>
                          </div>
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => handleUpdateCard(card.id)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-mono font-bold">SAVE</button>
                            <button onClick={() => setEditingCardId(null)} className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-mono font-bold border border-slate-700">CANCEL</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => toggleCardPublic(card.id, card.is_public)}
                              className={`px-2 py-1 rounded text-xs ${card.is_public ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-300'}`}
                            >
                              {card.is_public ? '🌐 公開中' : '🔒 非公開'}
                            </button>
                            <span className="text-xs font-black tracking-tight">{card.front}</span>
                            <span className="text-slate-500 text-[10px]">|</span>
                            <span className="text-xs text-blue-400 font-medium">{card.back}</span>
                            <span className="text-[8px] font-mono uppercase tracking-wider text-slate-500 px-1.5 py-0.2 bg-slate-950/40 rounded border border-slate-850">{card.category || 'General'}</span>
                            {card.is_public && (
                              <span className="text-[8px] font-mono text-green-500 font-bold bg-green-500/5 border border-green-500/20 px-1 py-0.2 rounded">PUBLIC</span>
                            )}
                          </div>
                          {card.example && <p className="text-[11px] text-slate-400 italic font-sans">{card.example}</p>}
                          <div className="text-[8px] font-mono text-slate-500 pt-1">
                            INTERVAL: {card.interval || 1}d • EF: {card.efactor?.toFixed(2) || '2.50'} • REPETITION: {card.repetition || 0}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEditing(card)} className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                          <button onClick={() => handleDeleteCard(card.id)} className="p-1.5 rounded-lg border border-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      )}

      {/* 🌐 SHARED (パブリック共有マーケット) タブ */}
      {activeTab === 'shared' && (
        <main className="flex-grow p-6 max-w-4xl w-full mx-auto space-y-4 relative z-10">
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
              {sharedCards.map(sCard => (
                <div key={sCard.id} className={`p-4 rounded-2xl border flex justify-between items-start gap-4 transition ${cardClass}`}>
                  <div className="space-y-1 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-gray tracking-tight text-gray">{sCard.front}</span>
                      <span className="text-slate-600 text-[10px]">|</span>
                      <span className="text-xs text-blue-400 font-medium">{sCard.back}</span>
                      <span className="text-[8px] font-mono uppercase tracking-wider text-purple-400 px-1.5 py-0.2 bg-purple-500/10 rounded border border-purple-500/20">{sCard.category || 'Shared'}</span>
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
      )}

      {/* 📊 分析ダッシュボード */}
      {activeTab === 'dashboard' && (
        <main className="flex-grow p-6 max-w-4xl w-full mx-auto space-y-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border text-center ${subContainerClass}`}>
              <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider block uppercase mb-1">Total Deck Size</span>
              <span className="text-xl font-black tracking-tight">{cards.length}</span>
              <span className="text-[8px] font-mono text-slate-400 block mt-0.5">CARDS INSTALLED</span>
            </div>
            <div className={`p-4 rounded-2xl border text-center ${subContainerClass}`}>
              <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider block uppercase mb-1">Mastery Rate</span>
              <span className="text-xl font-black tracking-tight text-blue-400">{masterRate}%</span>
              <span className="text-[8px] font-mono text-slate-400 block mt-0.5">{masteredCards} CARDS MASTERED</span>
            </div>
            <div className={`p-4 rounded-2xl border text-center ${subContainerClass}`}>
              <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider block uppercase mb-1">Current Streak</span>
              <span className="text-xl font-black tracking-tight text-orange-500">{streak} 🔥</span>
              <span className="text-[8px] font-mono text-slate-400 block mt-0.5">DAYS LEARNING IN A ROW</span>
            </div>
            <div className={`p-4 rounded-2xl border text-center ${subContainerClass}`}>
              <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider block uppercase mb-1">Learning Level</span>
              <span className="text-xl font-black tracking-tight text-purple-400">LV.{level}</span>
              <span className="text-[8px] font-mono text-slate-400 block mt-0.5">RANK: {title}</span>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${subContainerClass}`}>
            <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase mb-4">SYSTEM NOTIFICATIONS</h4>
            <div className="space-y-3">
              <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${innerBoxClass}`}>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold tracking-wide block">リマインダー・プッシュ通知設定</span>
                  <p className="text-[11px] text-slate-400">毎日決まった時間に復習通知を受け取り、忘却曲線を防ぎストリークを維持します。</p>
                </div>
                <button onClick={triggerTestNotification} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-[10px] border border-slate-700 rounded-lg transition whitespace-nowrap">
                  TEST NOTIFICATION
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* フッター */}
      <footer className={`py-4 text-center text-[9px] border-t font-mono font-bold tracking-widest ${isDark ? 'bg-slate-900 border-slate-800 text-slate-600' : 'bg-white border-slate-200 text-slate-400'}`}>
        FLIP-N ULTIMATE // POWERED BY NOBUHIRO SYSTEM
      </footer>

      {/* トースト通知 */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-mono font-bold tracking-wide shadow-xl max-w-xs w-full justify-center transition-all ${toastType === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : toastType === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}
        >
          {toastType === 'success' && <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          {toastType === 'error' && <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          {toastType === 'info' && <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          <span className="truncate">{toastMessage}</span>
        </motion.div>
      )}

    </div>
  );
}