"use client";

import confetti from 'canvas-confetti';
import React, { useState, useEffect, useRef } from 'react';
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
import QuizContainer from './components/QuizContainer';
import HomeContainer from './components/HomeContainer';
import StudyContainer from './components/StudyContainer';
import AppHeader from './components/AppHeader';
import HomeTabContent from './components/HomeTabContent';
import ManageTabContent from './components/ManageTabContent';
import SharedTabContent from './components/SharedTabContent';
import DashboardTabContent from './components/DashboardTabContent';

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

export interface LeaderboardUser {
  name: string;
  words: number;
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
  const profile = useProfile(user, supabase, showToast);

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  const [isRankingLoading, setIsRankingLoading] = useState(true);

  // 2. AIパートナー用のState
  const [aiCharacter, setAiCharacter] = useState("🦊"); // 🦊(キツネ先生), 🤖(サイバーロボ), 👑(ツンデレキング)
  const [aiMessage, setAiMessage] = useState("フリップ・エヌ プロへようこそ！今日の復習カードが君を待っているよ。のんびりやろうね。");

  // 3. 共有ルーム（共同編集）用のState
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [inputRoomId, setInputRoomId] = useState("");

  // 🎮 ミニクイズ用のState
  const [quickQuizCard, setQuickQuizCard] = useState<any>(null); // 出題するカード
  const [quickQuizOptions, setQuickQuizOptions] = useState<string[]>([]); // 選択肢
  const [quickQuizStatus, setQuickQuizStatus] = useState<'idle' | 'correct' | 'wrong'>('idle'); // 判定ステータス
  const [selectedOption, setSelectedOption] = useState<string | null>(null); // ユーザーが選んだ選択肢

  // 4. 新機能管理用の画面開閉State
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

  // 'home' = ホーム画面, 'study' = 単語カード/学習画面
  const [currentScreen, setCurrentScreen] = useState<'home' | 'study'>('home');

  const [cards, setCards] = useState<Card[]>([]);
  // 🗂️ デッキ（単語帳）用のState
  const [decks, setDecks] = useState<any[]>([]);
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [isDeckPublic, setIsDeckPublic] = useState(false);
  const [publicDecks, setPublicDecks] = useState<any[]>([]); // みんなが公開したデッキ用
  const [sharedCards, setSharedCards] = useState<Card[]>([]);
  const [displayCards, setDisplayCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'study' | 'test' | 'manage' | 'shared' | 'dashboard'>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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
        data.forEach((card: any) => {
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

  const PRESET_DECKS = [
    {
      id: 'essential_100',
      title: '最頻出英単語 100選',
      description: '日常会話からTOEICまで、絶対に落とせない必須の100単語。',
      icon: '🔥',
      category: 'Essential',
      cards: [
        { front: 'absolutely', back: '完全に、絶対に', example: 'You are absolutely right.', category: 'Essential' },
        { front: 'accept', back: '受け入れる', example: 'I accept your apology.', category: 'Essential' },
        { front: 'accomplish', back: '成し遂げる', example: 'We can accomplish this together.', category: 'Essential' },
        { front: 'accurate', back: '正確な', example: 'Is this information accurate?', category: 'Essential' },
        { front: 'achieve', back: '達成する', example: 'She achieved her goal.', category: 'Essential' },
        { front: 'actually', back: '実は、実際に', example: 'Actually, I have a question.', category: 'Essential' },
        { front: 'adapt', back: '適応する', example: 'It is hard to adapt to a new culture.', category: 'Essential' },
        { front: 'additionally', back: 'さらに', example: 'Additionally, we need more time.', category: 'Essential' },
        { front: 'affect', back: '影響を与える', example: 'The weather will affect our plans.', category: 'Essential' },
        { front: 'alternative', back: '代わりの、選択肢', example: 'We need to find an alternative plan.', category: 'Essential' },
        { front: 'analyze', back: '分析する', example: 'We need to analyze the data.', category: 'Essential' },
        { front: 'apparent', back: '明らかな', example: 'It became apparent that he was lying.', category: 'Essential' },
        { front: 'approach', back: '接近する、アプローチ', example: 'We need a new approach.', category: 'Essential' },
        { front: 'appropriate', back: '適切な', example: 'Is this appropriate for a wedding?', category: 'Essential' },
        { front: 'assume', back: '仮定する、思い込む', example: 'Don\'t assume anything.', category: 'Essential' },
        { front: 'available', back: '利用可能な、手が空いている', example: 'Are you available tomorrow?', category: 'Essential' },
        { front: 'benefit', back: '利益、恩恵', example: 'There are many benefits to exercising.', category: 'Essential' },
        { front: 'capable', back: '能力がある', example: 'She is capable of handling this.', category: 'Essential' },
        { front: 'circumstance', back: '状況', example: 'Under no circumstances should you do this.', category: 'Essential' },
        { front: 'colleague', back: '同僚', example: 'He is my former colleague.', category: 'Essential' },
        { front: 'comfortable', back: '快適な', example: 'This chair is very comfortable.', category: 'Essential' },
        { front: 'commit', back: '約束する、専念する', example: 'I commit to finishing this project.', category: 'Essential' },
        { front: 'complicated', back: '複雑な', example: 'The rules are quite complicated.', category: 'Essential' },
        { front: 'concentrate', back: '集中する', example: 'I need to concentrate on my study.', category: 'Essential' },
        { front: 'conclude', back: '結論づける', example: 'What did you conclude?', category: 'Essential' },
        { front: 'consequence', back: '結果、影響', example: 'Actions have consequences.', category: 'Essential' },
        { front: 'consider', back: 'よく考える', example: 'Please consider my offer.', category: 'Essential' },
        { front: 'consistent', back: '一貫した', example: 'We need to be consistent.', category: 'Essential' },
        { front: 'contribute', back: '貢献する', example: 'He contributed a lot to the team.', category: 'Essential' },
        { front: 'convince', back: '納得させる', example: 'I tried to convince him.', category: 'Essential' },
        { front: 'crucial', back: '極めて重要な', example: 'This step is crucial.', category: 'Essential' },
        { front: 'currently', back: '現在は', example: 'I am currently working from home.', category: 'Essential' },
        { front: 'decrease', back: '減る、減らす', example: 'Sales have decreased this month.', category: 'Essential' },
        { front: 'define', back: '定義する', example: 'How do you define success?', category: 'Essential' },
        { front: 'definitely', back: '間違いなく', example: 'I will definitely be there.', category: 'Essential' },
        { front: 'demonstrate', back: '実演する、証明する', example: 'Let me demonstrate how it works.', category: 'Essential' },
        { front: 'depend', back: '頼る、次第である', example: 'It depends on the weather.', category: 'Essential' },
        { front: 'despite', back: '〜にもかかわらず', example: 'We enjoyed it despite the rain.', category: 'Essential' },
        { front: 'determine', back: '決定する', example: 'We must determine the cause.', category: 'Essential' },
        { front: 'development', back: '発達、開発', example: 'Software development takes time.', category: 'Essential' },
        { front: 'discover', back: '発見する', example: 'They discovered a new island.', category: 'Essential' },
        { front: 'efficiency', back: '効率', example: 'We need to improve efficiency.', category: 'Essential' },
        { front: 'emphasize', back: '強調する', example: 'I want to emphasize this point.', category: 'Essential' },
        { front: 'enable', back: '可能にする', example: 'This tool enables you to work faster.', category: 'Essential' },
        { front: 'encourage', back: '励ます、促す', example: 'My parents always encouraged me.', category: 'Essential' },
        { front: 'environment', back: '環境', example: 'We must protect the environment.', category: 'Essential' },
        { front: 'establish', back: '設立する、確立する', example: 'The company was established in 2000.', category: 'Essential' },
        { front: 'evaluate', back: '評価する', example: 'We need to evaluate the results.', category: 'Essential' },
        { front: 'eventually', back: '最終的には', example: 'Eventually, he found a job.', category: 'Essential' },
        { front: 'evidence', back: '証拠', example: 'Is there any evidence?', category: 'Essential' },
        { front: 'expect', back: '予期する、期待する', example: 'I expect to see you tomorrow.', category: 'Essential' },
        { front: 'experience', back: '経験', example: 'She has a lot of experience.', category: 'Essential' },
        { front: 'explore', back: '探検する、調査する', example: 'Let\'s explore the city.', category: 'Essential' },
        { front: 'factor', back: '要因', example: 'Money was a major factor.', category: 'Essential' },
        { front: 'familiar', back: 'よく知っている、なじみのある', example: 'You look familiar.', category: 'Essential' },
        { front: 'flexible', back: '柔軟な', example: 'My schedule is flexible.', category: 'Essential' },
        { front: 'frequently', back: '頻繁に', example: 'I frequently visit that cafe.', category: 'Essential' },
        { front: 'generate', back: '生み出す', example: 'This idea will generate revenue.', category: 'Essential' },
        { front: 'gradually', back: '徐々に', example: 'Things are gradually improving.', category: 'Essential' },
        { front: 'guarantee', back: '保証する', example: 'I cannot guarantee success.', category: 'Essential' },
        { front: 'hesitate', back: 'ためらう', example: 'Don\'t hesitate to ask questions.', category: 'Essential' },
        { front: 'identify', back: '特定する', example: 'Can you identify the suspect?', category: 'Essential' },
        { front: 'ignore', back: '無視する', example: 'Please ignore my last email.', category: 'Essential' },
        { front: 'immediately', back: 'すぐに', example: 'Call me immediately.', category: 'Essential' },
        { front: 'impact', back: '影響', example: 'The impact was huge.', category: 'Essential' },
        { front: 'improve', back: '改善する', example: 'I want to improve my English.', category: 'Essential' },
        { front: 'indicate', back: '示す', example: 'The map indicates the location.', category: 'Essential' },
        { front: 'influence', back: '影響（力）', example: 'She has a good influence on him.', category: 'Essential' },
        { front: 'initial', back: '最初の', example: 'My initial reaction was surprise.', category: 'Essential' },
        { front: 'innovative', back: '革新的な', example: 'They launched an innovative product.', category: 'Essential' },
        { front: 'instead', back: '代わりに', example: 'Let\'s go there instead.', category: 'Essential' },
        { front: 'investigate', back: '調査する', example: 'The police will investigate.', category: 'Essential' },
        { front: 'involve', back: '巻き込む、含む', example: 'The job involves traveling.', category: 'Essential' },
        { front: 'issue', back: '問題、発行する', example: 'That is not the main issue.', category: 'Essential' },
        { front: 'justify', back: '正当化する', example: 'How can you justify your actions?', category: 'Essential' },
        { front: 'knowledge', back: '知識', example: 'Knowledge is power.', category: 'Essential' },
        { front: 'maintain', back: '維持する', example: 'It is hard to maintain weight.', category: 'Essential' },
        { front: 'manage', back: '管理する、なんとかやり遂げる', example: 'How did you manage to do that?', category: 'Essential' },
        { front: 'mention', back: '言及する', example: 'He didn\'t mention anything about it.', category: 'Essential' },
        { front: 'necessary', back: '必要な', example: 'Is it really necessary?', category: 'Essential' },
        { front: 'observe', back: '観察する', example: 'We need to observe the changes.', category: 'Essential' },
        { front: 'obtain', back: '手に入れる', example: 'How can I obtain a visa?', category: 'Essential' },
        { front: 'obviously', back: '明らかに', example: 'Obviously, he is upset.', category: 'Essential' },
        { front: 'occur', back: '起こる', example: 'When did the accident occur?', category: 'Essential' },
        { front: 'opportunity', back: '機会', example: 'This is a great opportunity.', category: 'Essential' },
        { front: 'organize', back: '組織する、整理する', example: 'I need to organize my desk.', category: 'Essential' },
        { front: 'participate', back: '参加する', example: 'Everyone must participate.', category: 'Essential' },
        { front: 'particular', back: '特定の、好みがうるさい', example: 'I have no particular plans.', category: 'Essential' },
        { front: 'perform', back: '実行する、演じる', example: 'She will perform on stage.', category: 'Essential' },
        { front: 'perspective', back: '観点、見方', example: 'From my perspective, it is wrong.', category: 'Essential' },
        { front: 'potential', back: '可能性、潜在的な', example: 'He has great potential.', category: 'Essential' },
        { front: 'prepare', back: '準備する', example: 'I must prepare for the exam.', category: 'Essential' },
        { front: 'prevent', back: '防ぐ', example: 'We must prevent this disease.', category: 'Essential' },
        { front: 'previous', back: '前の', example: 'Do you have previous experience?', category: 'Essential' },
        { front: 'provide', back: '提供する', example: 'They provide free coffee.', category: 'Essential' },
        { front: 'purpose', back: '目的', example: 'What is the purpose of this meeting?', category: 'Essential' },
        { front: 'recognize', back: '認識する、見覚えがある', example: 'I didn\'t recognize you.', category: 'Essential' },
        { front: 'recommend', back: '勧める', example: 'I highly recommend this book.', category: 'Essential' },
        { front: 'reflect', back: '反射する、反映する', example: 'The results reflect our hard work.', category: 'Essential' },
        { front: 'require', back: '必要とする', example: 'This job requires patience.', category: 'Essential' }
      ]
    },
    {
      id: 'business_boost',
      title: 'ビジネス英語 START PACK',
      description: 'メールやミーティングで頻出する、オフィス必須のスマート表現。',
      icon: '💼',
      category: 'Business',
      cards: [
        { front: 'implement', back: '（計画などを）実行する、実施する', example: 'We will implement the new strategy next week.', category: 'Business' },
        { front: 'feasible', back: '実現可能な', example: 'Is this project budget feasible?', category: 'Business' },
        { front: 'agenda', back: '議題、協議事項', example: 'Let\'s review today\'s agenda.', category: 'Business' },
        { front: 'align', back: 'すり合わせる、連携する', example: 'We need to align our goals.', category: 'Business' },
        { front: 'attach', back: '添付する', example: 'Please find the attached file.', category: 'Business' },
        { front: 'budget', back: '予算', example: 'We are over budget this quarter.', category: 'Business' },
        { front: 'clarify', back: '明確にする', example: 'Could you clarify this point?', category: 'Business' },
        { front: 'collaborate', back: '協力する、共同作業する', example: 'We will collaborate with them.', category: 'Business' },
        { front: 'deadline', back: '締め切り', example: 'The deadline is next Friday.', category: 'Business' },
        { front: 'feedback', back: 'フィードバック、意見', example: 'I appreciate your feedback.', category: 'Business' },
        { front: 'negotiate', back: '交渉する', example: 'We need to negotiate the price.', category: 'Business' },
        { front: 'objective', back: '目的、目標', example: 'Our main objective is growth.', category: 'Business' },
        { front: 'overview', back: '概要', example: 'Can you give me a brief overview?', category: 'Business' },
        { front: 'pending', back: '保留中の', example: 'The payment is still pending.', category: 'Business' },
        { front: 'priority', back: '優先順位、優先事項', example: 'Safety is our top priority.', category: 'Business' },
        { front: 'proposal', back: '提案、企画書', example: 'Did you read my proposal?', category: 'Business' },
        { front: 'revenue', back: '収益、収入', example: 'Our revenue increased by 10%.', category: 'Business' },
        { front: 'schedule', back: '予定、スケジュール', example: 'Let\'s schedule a meeting.', category: 'Business' },
        { front: 'strategy', back: '戦略', example: 'We need a new marketing strategy.', category: 'Business' },
        { front: 'submit', back: '提出する', example: 'Please submit the report by 5 PM.', category: 'Business' },
        { front: 'update', back: '最新情報、更新する', example: 'Please give me an update.', category: 'Business' },
        { front: 'urgent', back: '緊急の', example: 'This matter is urgent.', category: 'Business' },
        { front: 'workflow', back: '作業手順、ワークフロー', example: 'We need to optimize our workflow.', category: 'Business' },
        { front: 'brainstorm', back: 'ブレインストーミングする', example: 'Let\'s brainstorm some ideas.', category: 'Business' },
        { front: 'wrap up', back: '終わりにする、まとめる', example: 'Let\'s wrap up the meeting.', category: 'Business' }
      ]
    },
    {
      id: 'travel_quick',
      title: '海外旅行すぐ使えるフレーズ',
      description: '空港、ホテル、レストランまでこれだけで安心のフレーズ集。',
      icon: '✈️',
      category: 'Travel',
      cards: [
        { front: 'Can I check my baggage?', back: '荷物を預かってもらえますか？', example: 'At the hotel reception.', category: 'Travel' },
        { front: 'Where is the restroom?', back: 'トイレはどこですか？', example: 'Excuse me, where is the restroom?', category: 'Travel' },
        { front: 'I\'d like to check in, please.', back: 'チェックインをお願いします。', example: 'Arriving at the hotel.', category: 'Travel' },
        { front: 'Can I have the menu, please?', back: 'メニューを見せてもらえますか？', example: 'At the restaurant.', category: 'Travel' },
        { front: 'Check, please.', back: 'お会計をお願いします。', example: 'After finishing your meal.', category: 'Travel' },
        { front: 'How much is this?', back: 'これはいくらですか？', example: 'When shopping for souvenirs.', category: 'Travel' },
        { front: 'Do you take credit cards?', back: 'クレジットカードは使えますか？', example: 'Before paying at a store.', category: 'Travel' },
        { front: 'Could you take a picture of us?', back: '写真を撮ってもらえませんか？', example: 'Asking a passerby.', category: 'Travel' },
        { front: 'I have a reservation under [Name].', back: '[名前]で予約しています。', example: 'I have a reservation under Smith.', category: 'Travel' },
        { front: 'Is breakfast included?', back: '朝食は含まれていますか？', example: 'Confirming hotel details.', category: 'Travel' },
        { front: 'Can you speak a little slower?', back: 'もう少しゆっくり話してもらえますか？', example: 'When you can\'t catch the words.', category: 'Travel' },
        { front: 'I\'m just looking, thank you.', back: '見ているだけです、ありがとう。', example: 'When a shop clerk asks to help.', category: 'Travel' },
        { front: 'Could we have a table for two?', back: '2人用の席をお願いできますか？', example: 'Entering a restaurant.', category: 'Travel' },
        { front: 'Tap water is fine.', back: '水道水で大丈夫です。', example: 'When asked about drinks.', category: 'Travel' },
        { front: 'Is it within walking distance?', back: '歩いて行ける距離ですか？', example: 'Asking for directions.', category: 'Travel' },
        { front: 'I think I\'m lost.', back: '道に迷ったみたいです。', example: 'Asking for help on the street.', category: 'Travel' },
        { front: 'Keep the change.', back: 'お釣りはとっておいてください。', example: 'Leaving a tip for a taxi driver.', category: 'Travel' },
        { front: 'Can I get a late checkout?', back: 'レイトチェックアウトは可能ですか？', example: 'Calling the front desk.', category: 'Travel' },
        { front: 'What do you recommend?', back: 'おすすめは何ですか？', example: 'Ordering at a restaurant.', category: 'Travel' },
        { front: 'I need a doctor.', back: '医者を呼んでください。', example: 'In case of a medical emergency.', category: 'Travel' }
      ]
    }
  ];

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
      generateQuickQuiz();
    }
  }, [activeTab, cards]);

  // 🔄 初回読み込み時やカード数が変わったときにランキングを更新
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchRealRanking();
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
      const newCards: any[] = [];

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
  const [streak, setStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState(''); // 最後に勉強した日付
  const [level, setLevel] = useState(1);
  const [title, setTitle] = useState('BEGINNER');
  const [showShareModal, setShowShareModal] = useState(false); // 🌟 モーダルの開閉管理
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // 🌟 1. デイリーミッションの進捗状態
  const [dailyMissions, setDailyMissions] = useState({
    studyCount: 0,       // 今日めくった枚数 (目標: 10)
    testCompleted: false, // テストをやったか
    speakCompleted: false // 発音分析をやったか
  });

  const [flipCoins, setFlipCoins] = useState(0); // 報酬用のコイン

  // 🌟 2. 各アクションが起きた時に進捗をカウントアップする関数
  const incrementMissionProgress = (type: 'study' | 'test' | 'speak') => {
    setDailyMissions(prev => {
      const updated = { ...prev };
      if (type === 'study') updated.studyCount = Math.min(prev.studyCount + 1, 10);
      if (type === 'test') updated.testCompleted = true;
      if (type === 'speak') updated.speakCompleted = true;

      // 【演出】もしこのアクションで新しくミッションがコンプリートされたらコインを付与
      if (type === 'study' && prev.studyCount === 9 && updated.studyCount === 10) {
        setFlipCoins(c => c + 50);
        setToastType('success');
        setToastMessage('✨ ミッション達成: 10枚学習 (+50 COINS!)');
      }
      if (type === 'test' && !prev.testCompleted && updated.testCompleted) {
        setFlipCoins(c => c + 30);
        setToastType('success');
        setToastMessage('✨ ミッション達成: クイズに挑戦 (+30 COINS!)');
      }
      if (type === 'speak' && !prev.speakCompleted && updated.speakCompleted) {
        setFlipCoins(c => c + 40);
        setToastType('success');
        setToastMessage('✨ ミッション達成: 発音分析に挑戦 (+40 COINS!)');
      }

      return updated;
    });
  };

  // 🔄 ストリークをSupabaseまたはlocalStorageと同期する関数
  async function syncStreak(currentUser: any) {
    // DBで扱いやすいように "YYYY-MM-DD" 形式の文字列を作成
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // --- ゲストユーザー（未ログイン）の場合 ---
    if (!currentUser) {
      const today = now.toDateString();
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
      return;
    }

    // --- ログインユーザーの場合（Supabaseと同期） ---
    try {
      // データベースからプロフィールを取得
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('streak_count, last_login_date')
        .eq('id', currentUser.id)
        .maybeSingle(); // single()だとデータがない時にエラーになるためmaybeSingleを使用

      // プロフィールがまだ存在しない場合は新規作成（サインアップ直後など）
      if (!profile) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{ id: currentUser.id, streak_count: 1, last_login_date: todayStr }])
          .select()
          .single();
        if (newProfile) setStreak(1);
        return;
      }

      let currentStreak = profile.streak_count || 0;
      let lastLogin = profile.last_login_date; // SQLのdate型は "YYYY-MM-DD" 形式で返ってきます
      let nextStreak = currentStreak;

      if (lastLogin === todayStr) {
        // 今日すでにログインしている場合は維持
        nextStreak = currentStreak === 0 ? 1 : currentStreak;
      } else {
        // 昨日を表す日付文字列を作成
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastLogin === yesterdayStr) {
          // 前回のログインが昨日ならストリーク＋1
          nextStreak = currentStreak + 1;
        } else {
          // 1日以上空いていたらストリークを1にリセット
          nextStreak = 1;
        }

        // データベースを更新
        await supabase
          .from('profiles')
          .update({ streak_count: nextStreak, last_login_date: todayStr, updated_at: new Date().toISOString() })
          .eq('id', currentUser.id);
      }

      setStreak(nextStreak);
    } catch (e) {
      console.error("Streak sync error:", e);
    }
  }

  // 🌟 1. 自分のデッキをエクスポートして共有URLを発行する関数
  const handleShareDeck = async (deckTitle: string, deckDescription: string) => {
    if (!user) {
      setToastType('error');
      setToastMessage('共有するにはログインが必要です');
      return;
    }

    setToastType('info');
    setToastMessage('共有URLを生成中...');

    try {
      // ① 親テーブル (shared_decks) にデッキの基本情報を登録
      const { data: deckData, error: deckError } = await supabase
        .from('shared_decks')
        .insert([{ title: deckTitle, description: deckDescription, creator_id: user.id }])
        .select()
        .single();

      if (deckError) throw deckError;

      // ② 子テーブル (shared_deck_cards) に現在の全カードを紐付けて一括登録
      const cardsToInsert = cards.map(card => ({
        deck_id: deckData.id,
        front: card.front,
        back: card.back,
        example: card.example,
        category: card.category
      }));

      const { error: cardsError } = await supabase
        .from('shared_deck_cards')
        .insert(cardsToInsert);

      if (cardsError) throw cardsError;

      // ③ 共有URLを生成してクリップボードにコピー
      const shareUrl = `${window.location.origin}?deck_id=${deckData.id}`;
      await navigator.clipboard.writeText(shareUrl);

      setToastType('success');
      setToastMessage('共有URLをコピーしました！SNSに貼り付けよう！');
    } catch (error: any) {
      // 👇 エラーのオブジェクトを文字列にしてトーストに表示させちゃう
      console.error("Share Error Details:", error);
      setToastType('error');
      // error.message や error.details があればそれを画面に出す
      setToastMessage(`URL作成失敗: ${error?.message || JSON.stringify(error) || '未知のエラー'}`);
    }
  };

  // 🌟 2. URLのパラメータから自動でインポート画面を起動する処理 (useEffect)
  useEffect(() => {
    // URLの「?deck_id=xxxx」をチェック
    const queryParams = new URLSearchParams(window.location.search);
    const deckId = queryParams.get('deck_id');

    if (deckId) {
      // 共有されたデッキの情報をバックエンドから取得する関数を呼ぶ
      fetchAndPromptImport(deckId);
    }
  }, []);

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

  // 🌟 3. 共有データを取得して、インポート確認ダイアログを出す関数
  const fetchAndPromptImport = async (deckId: string) => {
    try {
      // 親のデッキ情報を取得
      const { data: deck, error: deckError } = await supabase
        .from('shared_decks')
        .select('title, description')
        .eq('id', deckId)
        .single();

      if (deckError || !deck) return;

      // 子のカードリストを取得
      const { data: sharedCards, error: cardsError } = await supabase
        .from('shared_deck_cards')
        .select('front, back, example, category')
        .eq('deck_id', deckId);

      if (cardsError || !sharedCards) return;

      // ブラウザの確認ダイアログ（または自作モーダル）でユーザーに確認
      const confirmImport = window.confirm(
        `共有デッキ「${deck.title}」(${sharedCards.length}枚のカード) が見つかりました。\nあなたの単語帳にインポートしますか？`
      );

      if (confirmImport) {
        // 既存の自分のカード配列（cards）に、新しいカードたちを流し込む
        // ※実際はローカルストレージや自分用のDBテーブルにも保存する処理をここに挟みます
        const importedCards = sharedCards.map(c => ({
          id: Date.now() + Math.floor(Math.random() * 1000), // 🌟 文字列ではなく、一意の「数値(number)」を生成
          front: c.front,
          back: c.back,
          example: c.example,
          category: c.category || 'Shared',

          interval: 1,
          efactor: 2.5,
          repetition: 0,
          is_public: false,
          next_review_at: new Date().toISOString()
        }));

        // 既存の単語帳にマージ
        setCards(prev => [...prev, ...importedCards]);
        setToastType('success');
        setToastMessage(`${deck.title} のインポートが完了しました！`);

        // URLのパラメータを綺麗に消去（何度もリロードでインポートされないように）
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) {
      console.error('インポートエラー:', err);
    }
  };

  // 🎯 勉強が完了した時の関数（お使いの完了処理関数の中に追記してください）
  const handleStudyComplete = async () => {
    if (!user) return;

    // 今日の日付を「YYYY-MM-DD」形式で取得
    const todayStr = new Date().toISOString().split('T')[0];

    // ⚠️ 今日すでに勉強済みの場合は、ストリークは増やさない（1日に何度も増えるのを防ぐ）
    if (lastStudyDate === todayStr) {
      console.log("今日はもうストリーク更新済みです！");
      return;
    }

    // ストリークを1増やす（昨日やっていれば継続、リセットされていれば1日目になる）
    const newStreak = streak + 1;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          streak_count: newStreak,
          last_study_date: todayStr // 最終勉強日を今日にする
        })
        .eq('id', user.id);

      if (error) throw error;

      // フロントエンドの画面（State）も更新
      setStreak(newStreak);
      setLastStudyDate(todayStr);

      alert(`🔥 ストリーク達成！ ${newStreak} 日連続勉強中！`);
    } catch (err) {
      console.error("ストリークの更新に失敗:", err);
    }
  };

  // 🟢 学習ログを管理するState（ヒートマップ表示用：{ "YYYY-MM-DD": カウント } の形式）
  const [studyLogs, setStudyLogs] = useState<{ [key: string]: number }>({});

  // 🟢 学習数を1増やす関数
  async function recordStudy() {
    const todayStr = new Date().toISOString().split('T')[0];

    // --- ゲストユーザー（未ログイン）の場合 ---
    if (!user) {
      const localLogs = JSON.parse(localStorage.getItem('study_logs_local') || '{}');
      localLogs[todayStr] = (localLogs[todayStr] || 0) + 1;
      localStorage.setItem('study_logs_local', JSON.stringify(localLogs));
      setStudyLogs(localLogs);
      return;
    }

    // --- ログインユーザーの場合（SupabaseにUPSERT） ---
    try {
      // ON CONFLICT (user_id, study_date) を利用して、データがあれば card_count を+1、なければ新規挿入
      // ※ただ、RPCを使わずにJSだけでやるため、一度現在の数を取得するか、以下のやり方で安全に更新します
      const currentCount = studyLogs[todayStr] || 0;
      const newCount = currentCount + 1;

      const { error } = await supabase
        .from('study_logs')
        .upsert(
          { user_id: user.id, study_date: todayStr, card_count: newCount },
          { onConflict: 'user_id,study_date' }
        );

      if (!error) {
        setStudyLogs(prev => ({ ...prev, [todayStr]: newCount }));
      }
    } catch (e) {
      console.error("Failed to record study log:", e);
    }
  }

  // 🟢 過去の学習ログを読み込む関数
  async function fetchStudyLogs(currentUser: any) {
    if (!currentUser) {
      const localLogs = JSON.parse(localStorage.getItem('study_logs_local') || '{}');
      setStudyLogs(localLogs);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('study_logs')
        .select('study_date, card_count')
        .eq('user_id', currentUser.id);

      if (data && !error) {
        const logsMap: { [key: string]: number } = {};
        data.forEach(log => {
          logsMap[log.study_date] = log.card_count;
        });
        setStudyLogs(logsMap);
      }
    } catch (e) {
      console.error("Failed to fetch study logs:", e);
    }
  }



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

  // 🗂️ 1. 自分のデッキ一覧をSupabaseから取得する
  async function fetchMyDecks(currentUser: any) {
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
    if (!displayCards || displayCards.length === 0) return;
    const currentCard = displayCards[currentIndex];
    if (!currentCard) return;

    recordStudy();




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

    incrementMissionProgress('study');
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

  // ⭕ テーマの読み込みだけ初期起動時に行う
  useEffect(() => {
    const savedTheme = localStorage.getItem('user_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme as any);
  }, []);

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

  const mainTabMasteredCards = cards.filter((c: any) => c.interval > 1).length;
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

      {/* ========== 🌟 新機能全部入り特大モーダル ========== */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-3xl shadow-2xl p-6 my-8 ${isDark ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>

            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-black font-mono tracking-wider text-blue-500">FLIP-N PRO EXTENSIONS</h2>
                <p className="text-xs text-slate-400 mt-1">ユーザーが集まる＆爆伸びする神機能全部入りパック</p>
              </div>
              <button onClick={() => setIsExtensionModalOpen(false)} className="text-sm font-mono px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg">CLOSE</button>
            </div>

            {/* 2カラムレイアウト */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* 左側：① AI相棒パートナー & ② 共同編集 */}
              <div className="space-y-6">

                {/* ① AI相棒パートナー */}
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h3 className="text-xs font-black font-mono mb-3 text-purple-500 flex items-center gap-1">🤖 1. AI STUDY PARTNER</h3>
                  <div className="flex gap-3 mb-4">
                    {['🦊', '🤖', '👑'].map((char) => (
                      <button
                        key={char}
                        onClick={() => {
                          setAiCharacter(char);
                          setAiMessage(char === '🦊' ? "よろしくね！" : char === '🤖' ? "システム起動。" : "な、何よ？");
                        }}
                        className={`text-xl p-2 rounded-xl border transition ${aiCharacter === char ? 'border-blue-500 bg-blue-500/10 scale-110' : 'border-transparent'}`}
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed font-bold ${isDark ? 'bg-slate-900 border-slate-800 text-purple-300' : 'bg-white border-slate-200 text-purple-700'}`}>
                    <span className="text-lg mr-1">{aiCharacter}</span> 「{aiMessage}」
                  </div>
                </div>

                {/* ② 共同編集ルーム */}
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h3 className="text-xs font-black font-mono mb-3 text-green-500 flex items-center gap-1">👥 2. SHARED ROOM (共同編集)</h3>
                  <p className="text-[10px] text-slate-400 mb-3">同じルームIDを入力した友達と、リアルタイムに1つの単語帳を一緒に作って学習できます。</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ルームID（例: toeic-benkyo）"
                      value={inputRoomId}
                      onChange={(e) => setInputRoomId(e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}
                    />
                    <button onClick={handleJoinRoom} className="px-4 py-2 bg-green-600 text-white font-bold rounded-xl text-xs hover:bg-green-500 transition">参加/作成</button>
                  </div>
                  {currentRoomId && (
                    <div className="mt-3 text-xs text-green-500 font-mono font-bold flex items-center gap-1">
                      🟢 接続中ルーム: {currentRoomId}
                    </div>
                  )}
                </div>
              </div>

              {/* 右側：③ 世界ランキング & ④ CSVインポート */}
              <div className="space-y-6">

                {/* ③ 世界ランキング */}
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h3 className="text-xs font-black font-mono mb-3 text-yellow-500 flex items-center gap-1">🏆 3. WORLD RANKING (今週のトップ)</h3>
                  <div className="space-y-2">
                    {leaderboard.map((player, index) => (
                      <div key={player.name} className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-mono border ${index === 0 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-transparent'}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold w-4 text-slate-400">#{index + 1}</span>
                          <span className="font-bold">{player.name}</span>
                        </div>
                        <div className="flex gap-4 text-[11px] text-slate-400">
                          <span>{player.words}日連続</span>
                          <span className="font-bold text-yellow-500">{player.words}単語</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ④ Anki / CSV インポート */}
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h3 className="text-xs font-black font-mono mb-3 text-blue-500 flex items-center gap-1">📁 4. ANKI / CSV IMPORT</h3>
                  <p className="text-[10px] text-slate-400 mb-3">他アプリで作った単語データ（CSV）を一瞬でFLIP-Nにインポート。カンマ区切り「英語,日本語,例文」のファイルに対応しています。</p>
                  <label className="block w-full text-center px-4 py-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 cursor-pointer transition">
                    <span className="text-xs font-bold text-slate-400">CSVファイルを選択して爆速インポート</span>
                    <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
                  </label>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
