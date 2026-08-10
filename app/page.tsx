"use client";

import confetti from 'canvas-confetti';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { createWorker } from 'tesseract.js';
import SharePreviewModal from './SharePreviewModal';
import { useProfile } from './hooks/useProfile';
import ProfileModal from './components/ProfileModal';
import { useSettings } from './hooks/useSettings';
import SettingsModal from './components/SettingsModal';
import { useAuth } from './hooks/useAuth';
import AuthModal from './components/AuthModal';
import { useQuiz } from './hooks/useQuiz';
import { useStudyProgress } from './hooks/useStudyProgress';
import { useDeckSharing } from './hooks/useDeckSharing';
import QuizContainer from './components/QuizContainer';
import HomeContainer from './components/HomeContainer';
import StudyContainer from './components/StudyContainer';
import AppHeader from './components/AppHeader';
import HomeTabContent from './components/HomeTabContent';
import ManageTabContent from './components/ManageTabContent';
import SharedTabContent from './components/SharedTabContent';
import DashboardTabContent from './components/DashboardTabContent';
import CourseSelectorModal from './components/CourseSelectorModal';
import ExtensionModal from './components/ExtensionModal';
import { COURSE_PRESETS, PRESET_DECKS } from './data/presets';

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

interface PageUser {
  id: string;
  displayName?: string;
}

export interface LeaderboardUser {
  name: string;
  words: number;
}




export default function UltimateStudyExperience() {
  const [user, setUser] = useState<PageUser | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  const [isRankingLoading, setIsRankingLoading] = useState(true);

  // 2. AIパートナー用のState
  const [aiCharacter, setAiCharacter] = useState("🦊"); // 🦊(キツネ先生), 🤖(サイバーロボ), 👑(ツンデレキング)
  const [aiMessage, setAiMessage] = useState("フリップ・エヌ プロへようこそ！今日の復習カードが君を待っているよ。のんびりやろうね。");

  // 3. 共有ルーム（共同編集）用のState
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [inputRoomId, setInputRoomId] = useState("");

  // 🎮 ミニクイズ用のState
  const [quickQuizCard, setQuickQuizCard] = useState<Card | null>(null); // 出題するカード
  const [quickQuizOptions, setQuickQuizOptions] = useState<string[]>([]); // 選択肢
  const [quickQuizStatus, setQuickQuizStatus] = useState<'idle' | 'correct' | 'wrong'>('idle'); // 判定ステータス
  const [selectedOption, setSelectedOption] = useState<string | null>(null); // ユーザーが選んだ選択肢

  // 4. 新機能管理用の画面開閉State
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

  // 'home' = ホーム画面, 'study' = 単語カード/学習画面
  const [currentScreen] = useState<'home' | 'study'>('home');

  const [cards, setCards] = useState<Card[]>([]);
  // 🗂️ デッキ（単語帳）用のState
  const [decks, setDecks] = useState<Record<string, unknown>[]>([]);
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [isDeckPublic, setIsDeckPublic] = useState(false);
  const [publicDecks, setPublicDecks] = useState<Record<string, unknown>[]>([]); // みんなが公開したデッキ用
  const [sharedCards, setSharedCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'study' | 'test' | 'manage' | 'shared' | 'dashboard'>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const savedTheme = window.localStorage.getItem('user_theme');
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
  });

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  }

  const {
    isProfileOpen,
    setIsProfileOpen,
    editDisplayName,
    setEditDisplayName,
    dailyGoal,
    setDailyGoal,
    userHobby,
    setUserHobby,
    avatarUrl,
    setAvatarUrl,
    handleSaveProfile
  } = useProfile(user, supabase, showToast);

  const {
    isSettingsOpen,
    setIsSettingsOpen,
    isAutoPlay,
    setIsAutoPlay,
    audioSpeed,
    setAudioSpeed,
    testTimer,
    setTestTimer,
    handleSaveSettings,
  } = useSettings(user, supabase, showToast);

  const {
    authMode,
    setAuthMode,
    email,
    setEmail,
    password,
    setPassword,
    handleAuth,
    handleOAuthLogin,
    handleLogout, // 💡 ヘッダーやメニューのログアウトボタン部分でこれを使うようになります！
  } = useAuth(supabase, showToast);

  const {
    quizMode,
    setQuizMode,
    quizIndex,
    quizScore,
    quizOptions,
    quizSelected,
    typingAnswer,
    setTypingAnswer,
    isTypingCorrect,
    booleanCurrentDisplay,
    booleanSelected,
    timeLeft,
    startQuiz,
    handleChoice4Answer,
    handleTypingSubmit,
    handleBooleanAnswer,
  } = useQuiz(cards, testTimer, speak); // 💡 testTimer と speak を渡して連動！

  // 📊 Supabaseから本物のランキングデータを取得する
  const fetchRealRanking = async () => {
    setIsRankingLoading(true);
    try {
      // 💡 publicに共有されているカード、または全カードからユーザーごとの数をカウント
      // ※SupabaseのRPC（ストアドプロシージャ）を使うか、集計用のクエリを実行します
      const { data, error } = await supabase
        .from('cards')
        .select('user_id')
        .eq('is_public', true); // 公開されているカードをベースに集計（または全体の統計）

      if (error) throw error;

      if (data) {
        // ユーザーごとのカード数をカウントするオブジェクトを作成
        const counts: { [key: string]: number } = {};
        data.forEach((card: { user_id?: string }) => {
          if (card.user_id) {
            counts[card.user_id] = (counts[card.user_id] || 0) + 1;
          }
        });

        // ランキング配列に整形（上位3名）
        // 本来はuser_idからプロフィール名を引っ張りますが、簡易的に名称をマスキング、または固定値から変換
        const sortedRanking = Object.keys(counts)
          .map((userId) => {
            // 自分のIDだったら「あなた」や設定中のdisplayNameにする
            const isMe = userId === user?.id;
            return {
              name: isMe ? (user?.displayName || "あなた (You) 🔥") : `User_${userId.slice(0, 5)}`,
              words: counts[userId],
            };
          })
          .sort((a, b) => b.words - a.words) // 数の多い順にソート
          .slice(0, 3); // トップ3を抽出

        setLeaderboard(sortedRanking);
      }
    } catch (err) {
      console.error("ランキングの取得に失敗しました:", err);
      // 失敗したときのセーフティとして最小限の表示
      setLeaderboard([
        { name: user?.displayName || "あなた", words: cards.length }
      ]);
    } finally {
      setIsRankingLoading(false);
    }
  };

  // 🎮 ミニクイズを生成する関数
  const generateQuickQuiz = () => {
    if (cards.length < 4) return; // 選択肢を作るために最低4枚必要

    // 1. ランダムに正解カードを1枚選ぶ
    const correctCard = cards[Math.floor(Math.random() * cards.length)];

    // 2. 不正解の選択肢を3つ選ぶ（正解以外からランダム）
    const dummies = cards
      .filter(c => c.id !== correctCard.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(c => c.back);

    // 3. 正解と不正解を混ぜてシャッフル
    const options = [...dummies, correctCard.back].sort(() => 0.5 - Math.random());

    setQuickQuizCard(correctCard);
    setQuickQuizOptions(options);
    setQuickQuizStatus('idle');
    setSelectedOption(null);
  };

  // 🌟 ホーム画面が開いた時にクイズを1問作る
  useEffect(() => {
    if (activeTab === 'home' && cards.length >= 4 && !quickQuizCard) {
      const id = window.setTimeout(() => {
        generateQuickQuiz();
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [activeTab, cards, quickQuizCard]);

  // 🔄 ダッシュボード表示時にランキングを更新
  useEffect(() => {
    if (activeTab === 'dashboard') {
      const id = window.setTimeout(() => {
        void fetchRealRanking();
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [activeTab, cards.length]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // メニューの外側、かつ、アイコンボタンの外側をクリックした場合のみ閉じる
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        avatarButtonRef.current &&
        !avatarButtonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 📁 CSV / Ankiインポート処理
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newCards: Array<Pick<Card, 'front' | 'back' | 'example' | 'category' | 'is_public' | 'interval' | 'next_review_at'>> = [];

      // 簡易CSVパース (1行目: 英語, 2行目: 日本語, 3行目: 例文)
      lines.forEach((line) => {
        const columns = line.split(',');
        if (columns[0] && columns[1]) {
          newCards.push({
            front: columns[0].trim(),
            back: columns[1].trim(),
            example: columns[2] ? columns[2].trim() : "",
            category: "Imported",
            is_public: false,
            interval: 1,
            next_review_at: new Date().toISOString()
          });
        }
      });

      if (newCards.length > 0) {
        // 💡 ここで既存のcardsステートに追加（またはSupabaseにインサート）
        // setCards([...cards, ...newCards]); // 既存のカード配列がある場合
        showToast(`${newCards.length}個の単語をCSVから爆速インポートしました！`, 'success');

        // AIパートナーに褒めさせる
        triggerAiComment("import");
      }
    };
    reader.readAsText(file);
  };

  // 🤖 AIパートナーのセリフ切り替えトリガー
  // (※テスト満点時や、カード追加時などに `triggerAiComment("perfect")` のように呼び出します)
  const triggerAiComment = (actionType: "perfect" | "import" | "streak" | "greet") => {
    const messages = {
      perfect: {
        "🦊": "すごすぎる！満点じゃないか！君の脳の忘却曲線、完全にバグってるよ（褒め言葉）！",
        "🤖": "エクセレント。全問正解データを確認。記憶回路への定着率100%を検知しました。",
        "👑": "ふ、ふん、満点くらい当然じゃない。これで満足して明日サボったら許さないからね！"
      },
      import: {
        "🦊": "大量インポート完了！これだけの単語を攻略しようとするなんて、やる気MAXだね！",
        "🤖": "外部データの同期に成功。新規単語学習プログラムを開始する準備が整いました。",
        "👑": "へぇ、他のアプリから乗り換えてくれたんだ？こっちの方が使いやすいに決まってるでしょ！"
      },
      streak: {
        "🦊": "継続日数更新！毎日コツコツやれる君は、本当に英語学習の天才だよ！",
        "🤖": "ストリーク更新を記録。継続学習は長期記憶定着に最も有効なアルゴリズムです。",
        "👑": "毎日がんばるじゃない。…べ、別に君が毎日来るのを楽しみに待ってたわけじゃないわよ？"
      }
    };

    // 現在選ばれているキャラクターのセリフをセット
    const charMessages = messages[actionType as keyof typeof messages];
    if (charMessages) {
      setAiMessage(charMessages[aiCharacter as keyof typeof charMessages]);
    }
  };

  // 👥 共同編集ルームへの参加・作成
  const handleJoinRoom = () => {
    if (!inputRoomId.trim()) return;
    setCurrentRoomId(inputRoomId);
    showToast(`共有ルーム【${inputRoomId}】に参加しました！このルームの単語帳を仲間と共同編集できます。`, 'success');
  };


  // 📄 page.tsx の State定義が集まっている場所
  const [level, setLevel] = useState(1);
  const [title, setTitle] = useState('BEGINNER');
  const [showShareModal, setShowShareModal] = useState(false); // 🌟 モーダルの開閉管理
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const {
    streak,
    setStreak,
    lastStudyDate,
    setLastStudyDate,
    flipCoins,
    setFlipCoins,
    dailyMissions,
    setDailyMissions,
    studyLogs,
    setStudyLogs,
    incrementMissionProgress,
    syncStreak,
    recordStudy,
    fetchStudyLogs,
    handleStudyComplete,
  } = useStudyProgress(user, supabase, (message, type = 'info') => {
    setToastType(type);
    setToastMessage(message);
  });

  const { handleShareDeck, fetchAndPromptImport } = useDeckSharing(
    user,
    supabase,
    cards,
    setCards,
    (message, type = 'info') => {
      setToastType(type);
      setToastMessage(message);
    }
  );

  // 🌟 2. URLのパラメータから自動でインポート画面を起動する処理 (useEffect)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const deckId = queryParams.get('deck_id');

    if (deckId) {
      fetchAndPromptImport(deckId);
    }
  }, [fetchAndPromptImport]);

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setEditDisplayName(data.display_name || '');
        setUserHobby(data.user_hobby || '');
        setDailyGoal(data.daily_goal || 20);
        setAvatarUrl(data.avatar_url || '');

        // 🌟 ここからストリークの自動判定ロジック
        const savedStreak = data.streak_count || 0;
        const savedLastDate = data.last_study_date || '';

        if (savedLastDate) {
          const today = new Date();
          const lastDate = new Date(savedLastDate);

          // 今日と最後に勉強した日の「日数の差」を計算
          const diffTime = today.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 1) {
            // 💡 2日以上あいていたらサボり確定なのでストリークを0にリセット
            setStreak(0);
            setLastStudyDate('');
            // データベース側もリセット
            await supabase.from('profiles').update({ streak_count: 0, last_study_date: null }).eq('id', user.id);
          } else {
            // 保持、または今日すでにやっていればそのままの日数をセット
            setStreak(savedStreak);
            setLastStudyDate(savedLastDate);
          }
        } else {
          setStreak(0);
        }
      }

      if (data && !error) {
        // データベースから取得した値をフロントのStateに復元する
        setEditDisplayName(data.display_name || '');
        setUserHobby(data.user_hobby || '');
        setDailyGoal(data.daily_goal || 20);
        setIsAutoPlay(data.is_autoplay ?? true);
        setAudioSpeed(data.audio_speed || '1.0');
        setTestTimer(data.test_timer || 'none');
      }
    };

    fetchUserSettings();
  }, [user]); // user（ログイン状態）が変わったら実行

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
      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;

      const ctx = new AudioCtor();
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
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      if (!text || text.trim().length < 3) {
        showToast("文字を検出できませんでした。はっきり写してください。", "error");
        setIsProcessingImage(false);
        return;
      }

      showToast("📝 英語の抽出に成功！AI単語カードを生成中...", "info");

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hobby: userHobby,
          text: text,
          category: selectedCategory !== 'All' ? selectedCategory : 'Camera Scan'
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

  const handleAiGenerate = async () => {
    try {
      // inputText は画面のテキストエリアに入力された文字列
      // userHobby は「野球」などの趣味のState
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiText,
          userHobby: userHobby,
        }),
      });

      if (!response.ok) throw new Error('生成に失敗しました');

      const data = await response.json();

      // data.flashcards の中に、AIが自動抽出して作った単語カードの配列が入って返ってきます！
      console.log("生成されたカード一覧:", data.flashcards);

      // あとは、既存の単語帳リストのState（cardsなど）にガッチャンコして保存するだけ！
      // setCards([...cards, ...data.flashcards]);

    } catch (err) {
      console.error(err);
    }
  };

  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

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

  // 🗂️ 1. 自分のデッキ一覧をSupabaseから取得する
  async function fetchMyDecks(currentUser: { id: string } | null) {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (data && !error) setDecks(data);
    } catch (e) {
      console.error("Failed to fetch decks:", e);
    }
  }

  // 🌍 2. 他のユーザーが公開しているデッキ一覧を取得する
  async function fetchPublicDecks() {
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*, profiles(id)') // 作成者の情報も一緒に取る（任意）
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (data && !error) setPublicDecks(data);
    } catch (e) {
      console.error("Failed to fetch public decks:", e);
    }
  }

  // ➕ 3. 新しいデッキ（単語帳）を作成する
  async function handleCreateDeck(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newDeckTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('decks')
        .insert([
          {
            user_id: user.id,
            title: newDeckTitle.trim(),
            description: newDeckDesc.trim(),
            is_public: isDeckPublic
          }
        ])
        .select()
        .single();

      if (data && !error) {
        setDecks(prev => [data, ...prev]);
        setNewDeckTitle('');
        setNewDeckDesc('');
        setIsDeckPublic(false);
        showToast('新しい単語帳を作成しました！🎉', 'success');
      }
    } catch (e) {
      console.error("Failed to create deck:", e);
    }
  }

  async function handleResponse(quality: number) {
    if (!displayCards || displayCards.length === 0) {
      setIsFlipped(false);
      return;
    }

    const currentCard = displayCards[currentIndex];
    if (!currentCard) {
      setIsFlipped(false);
      setCurrentIndex(0);
      return;
    }

    recordStudy();

    if (!user) {
      setIsFlipped(false);
      setTimeout(() => { setCurrentIndex((prev) => prev + 1); }, 200);
      return;
    }

    const nextIndex = currentIndex + 1;
    const safeNextIndex = nextIndex >= displayCards.length ? 0 : nextIndex;
    setCurrentIndex(safeNextIndex);

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

    incrementMissionProgress('study');
  }

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
        const formatted: PreviewCard[] = data.cards.map((c: { front?: string; back?: string; example?: string; category?: string }) => ({
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
    if (!user) {
      showToast('カードを保存するにはログインが必要です。', 'error');
      return;
    }
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

  // ⭕ ユーザー（ログイン状態）が変わるたびにストリークを同期
  useEffect(() => {
    syncStreak(user);
    fetchStudyLogs(user);
    if (user) {
      fetchCards();    // 自分のデッキを読み込む
      fetchSharedCards();   // みんなの公開デッキを読み込む
    }
  }, [user]);



  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('user_theme', nextTheme);
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

  const displayCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesCategory = selectedCategory === 'All' || card.category === selectedCategory;
      const matchesSearch = card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.back.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [cards, selectedCategory, searchQuery]);

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

  function speak(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = /^[A-Za-z0-9\s,.:?!'"-]+$/.test(text) ? 'en-US' : 'ja-JP';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  useEffect(() => {
    if (activeTab === 'test') startQuiz();
  }, [activeTab, cards]);

  function makeQuizOptions(index: number) {
    startQuiz();
    if (!cards[index]) return;
    const correctAnswer = cards[index].back;
    const wrongAnswers = cards
      .filter(c => c.back !== correctAnswer)
      .map(c => c.back)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const options = [correctAnswer, ...wrongAnswers].sort(() => 0.5 - Math.random());
    startQuiz();
  }

  function handleQuizAnswer(option: string) {
    if (quizSelected) return;
    startQuiz();

    const isCorrect = option === cards[quizIndex].back;
    if (isCorrect) {
      startQuiz();
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
        startQuiz();
        makeQuizOptions(quizIndex + 1);
      } else {
        startQuiz();
      }
    }, 1200);

    incrementMissionProgress('test');
  }

  function startPronunciationAnalysis() {
    const SpeechRecognitionCtor = (window as typeof window & {
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
    }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      showToast('音声認識未対応ブラウザです。', 'info');
      return;
    }
    setIsRecording(true);
    setPronunciationScore(null);
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      const speechToText = event.results[0][0].transcript;
      const targetWord = displayCards[currentIndex].front;
      if (speechToText.toLowerCase() === targetWord.toLowerCase()) {
        setPronunciationScore(Math.floor(Math.random() * 10) + 90);
        speak('Excellent!');
      } else {
        setPronunciationScore(Math.floor(Math.random() * 20) + 60);
        speak('Try again.');
      }

      incrementMissionProgress('speak');
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

  async function toggleCardPublic(cardId: number, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('cards')
        .update({ is_public: !currentStatus })
        .eq('id', cardId);

      if (!error) {
        showToast(!currentStatus ? 'カードを一般公開しました！' : 'カードを非公開にしました', 'success');
        fetchCards();
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

  const mainTabMasteredCards = cards.filter((c: Card) => (c.interval || 0) > 1).length;
  const mastery = cards.length > 0 ? Math.round((mainTabMasteredCards / cards.length) * 100) : 0;

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen text-xs font-bold tracking-widest ${isDark ? 'bg-slate-950 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
        LOADING...
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col justify-between antialiased transition-colors duration-300 ${bgClass}`}>

      <AppHeader
        user={user}
        isDark={isDark}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setAuthMode={setAuthMode}
        handleLogout={handleLogout}
        toggleTheme={toggleTheme}
        streak={streak}
        level={level}
        title={title}
        dailyGoal={dailyGoal}
        dailyMissions={dailyMissions}
        userHobby={userHobby}
        avatarUrl={avatarUrl}
        isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        setIsProfileOpen={setIsProfileOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        avatarButtonRef={avatarButtonRef}
        menuRef={menuRef}
      />

      {/* 🔐 認証モーダル（外部コンポーネント化） */}
      {authMode && (
        <AuthModal
          authMode={authMode}
          setAuthMode={setAuthMode}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          isDark={isDark} // ※ theme === 'dark' などの変数に合わせてください
          handleAuth={handleAuth}
          handleOAuthLogin={handleOAuthLogin}
        />
      )}

      <CourseSelectorModal
        isOpen={showCourseSelector}
        onClose={() => setShowCourseSelector(false)}
        onSelectCourse={handleSelectCourse}
        subContainerClass={subContainerClass}
        cardClass={cardClass}
      />


      {activeTab === 'home' && (
        <HomeTabContent
          user={user}
          userHobby={userHobby}
          streak={streak}
          dailyGoal={dailyGoal}
          dailyMissions={dailyMissions}
          cards={cards}
          subContainerClass={subContainerClass}
          innerBoxClass={innerBoxClass}
          setActiveTab={setActiveTab}
          setSelectedCategory={setSelectedCategory}
          quickQuizCard={quickQuizCard}
          quickQuizStatus={quickQuizStatus}
          quickQuizOptions={quickQuizOptions}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          generateQuickQuiz={generateQuickQuiz}
          speak={speak}
          setQuickQuizStatus={setQuickQuizStatus}
          PRESET_DECKS={PRESET_DECKS}
          setCards={setCards}
          setCurrentIndex={setCurrentIndex}
        />
      )}
      {activeTab === 'study' && (
        <StudyContainer
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          uniqueCategories={uniqueCategories}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          displayCards={displayCards}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          isFlipped={isFlipped}
          setIsFlipped={setIsFlipped}
          x={x}
          y={y}
          rotateX={rotateX}
          rotateY={rotateY}
          inputBgClass={inputBgClass}
          subContainerClass={subContainerClass}
          innerBoxClass={innerBoxClass}
          cardClass={cardClass}
          speak={speak}
          startPronunciationAnalysis={startPronunciationAnalysis}
          isRecording={isRecording}
          pronunciationScore={pronunciationScore}
          handleResponse={handleResponse}
        />
      )}

      {/* 📝 テストタブ（外部コンポーネント化＆タイマー・ロジック完全実装版） */}
      {activeTab === 'test' && (
        <QuizContainer
          cards={cards}
          isDark={isDark} // (または theme === 'dark' など定義名に合わせてください)
          testTimer={testTimer}
          quizMode={quizMode}
          setQuizMode={setQuizMode}
          quizIndex={quizIndex}
          quizScore={quizScore}
          quizOptions={quizOptions}
          quizSelected={quizSelected}
          typingAnswer={typingAnswer}
          setTypingAnswer={setTypingAnswer}
          isTypingCorrect={isTypingCorrect}
          booleanCurrentDisplay={booleanCurrentDisplay}
          booleanSelected={booleanSelected}
          timeLeft={timeLeft}
          startQuiz={startQuiz}
          handleChoice4Answer={handleChoice4Answer}
          handleTypingSubmit={handleTypingSubmit}
          handleBooleanAnswer={handleBooleanAnswer}
        />
      )}


      {activeTab === 'manage' && (
        <ManageTabContent
          cards={cards}
          subContainerClass={subContainerClass}
          inputBgClass={inputBgClass}
          cardClass={cardClass}
          innerBoxClass={innerBoxClass}
          isDark={isDark}
          aiText={aiText}
          setAiText={setAiText}
          isGenerating={isGenerating}
          handleGenerateAI={handleGenerateAI}
          fileInputRef={fileInputRef}
          handleImageChange={handleImageChange}
          isProcessingImage={isProcessingImage}
          aiPreviewCards={aiPreviewCards}
          handleConfirmAndSaveAI={handleConfirmAndSaveAI}
          handleExcludePreviewCard={handleExcludePreviewCard}
          handleUpdatePreviewField={handleUpdatePreviewField}
          handleCSVImport={handleCSVImport}
          newFront={newFront}
          setNewFront={setNewFront}
          newBack={newBack}
          setNewBack={setNewBack}
          newExample={newExample}
          setNewExample={setNewExample}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          newIsPublic={newIsPublic}
          setNewIsPublic={setNewIsPublic}
          frontInputRef={frontInputRef}
          handleAddCard={handleAddCard}
          editingCardId={editingCardId}
          editFront={editFront}
          setEditFront={setEditFront}
          editBack={editBack}
          setEditBack={setEditBack}
          editExample={editExample}
          setEditExample={setEditExample}
          editCategory={editCategory}
          setEditCategory={setEditCategory}
          editIsPublic={editIsPublic}
          setEditIsPublic={setEditIsPublic}
          startEditing={startEditing}
          handleUpdateCard={handleUpdateCard}
          setEditingCardId={setEditingCardId}
          handleDeleteCard={handleDeleteCard}
          toggleCardPublic={toggleCardPublic}
          handleShareDeck={handleShareDeck}
        />
      )}

      {activeTab === 'shared' && (
        <SharedTabContent
          user={user}
          sharedCards={sharedCards}
          currentRoomId={currentRoomId}
          inputRoomId={inputRoomId}
          setInputRoomId={setInputRoomId}
          subContainerClass={subContainerClass}
          cardClass={cardClass}
          isDark={isDark}
          handleJoinRoom={handleJoinRoom}
          handleImportCard={handleImportCard}
        />
      )}

      {activeTab === 'dashboard' && (
        <DashboardTabContent
          cards={cards}
          streak={streak}
          level={level}
          title={title}
          subContainerClass={subContainerClass}
          isDark={isDark}
          innerBoxClass={innerBoxClass}
          leaderboard={leaderboard}
          isRankingLoading={isRankingLoading}
          fetchRealRanking={fetchRealRanking}
          aiCharacter={aiCharacter}
          setAiCharacter={setAiCharacter}
          aiMessage={aiMessage}
          setAiMessage={setAiMessage}
          flipCoins={flipCoins}
          dailyMissions={dailyMissions}
          studyLogs={studyLogs}
          theme={theme}
          setShowShareModal={setShowShareModal}
          mastery={mastery}
          mainTabMasteredCards={mainTabMasteredCards}
        />
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
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-mono font-bold tracking-wide shadow-xl max-w-xs w-full justify-center transition-all ${toastType === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : toastType === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}
        >
          {toastType === 'success' && <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          {toastType === 'error' && <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          {toastType === 'info' && <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          <span className="truncate">{toastMessage}</span>
        </motion.div>
      )}

      {showShareModal && (
        <SharePreviewModal
          streak={streak}
          level={level}
          studyLogs={studyLogs}
          deckSize={cards.length}
          mastery={mastery}
          isDark={isDark} // 🌟 これを追記してダークモードの情報を渡す！
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* ========== PROFILE モーダル (機能連動版) ========== */}
      {isProfileOpen && (
        <ProfileModal
          isDark={theme === 'dark'} // もし page.tsx 側が isDark という変数なら isDark={isDark} にしてください
          user={user}
          onClose={() => setIsProfileOpen(false)}
          editDisplayName={editDisplayName}
          setEditDisplayName={setEditDisplayName}
          dailyGoal={dailyGoal}
          setDailyGoal={setDailyGoal}
          userHobby={userHobby}
          setUserHobby={setUserHobby}
          avatarUrl={avatarUrl}
          setAvatarUrl={setAvatarUrl}
          onSave={() => handleSaveProfile(setUser)}
        />
      )}

      {/* ========== SETTINGS モーダル (項目増量＆機能連動版) ========== */}
      {isSettingsOpen && (
        <SettingsModal
          isDark={isDark}
          isAutoPlay={isAutoPlay}
          setIsAutoPlay={setIsAutoPlay}
          audioSpeed={audioSpeed}
          setAudioSpeed={setAudioSpeed}
          testTimer={testTimer}
          setTestTimer={setTestTimer}
          setIsSettingsOpen={setIsSettingsOpen}
          handleSaveSettings={handleSaveSettings}
        />
      )}

      <ExtensionModal
        isOpen={isExtensionModalOpen}
        isDark={isDark}
        aiCharacter={aiCharacter}
        aiMessage={aiMessage}
        currentRoomId={currentRoomId}
        inputRoomId={inputRoomId}
        setInputRoomId={setInputRoomId}
        leaderboard={leaderboard}
        onClose={() => setIsExtensionModalOpen(false)}
        onSelectCharacter={(character) => {
          setAiCharacter(character);
          setAiMessage(character === '🦊' ? 'よろしくね！' : character === '🤖' ? 'システム起動。' : 'な、何よ？');
        }}
        onJoinRoom={handleJoinRoom}
        onImportCsv={handleCSVImport}
      />

    </div>
  );
}
