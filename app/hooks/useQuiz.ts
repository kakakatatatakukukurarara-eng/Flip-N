// src/hooks/useQuiz.ts
import { useState, useEffect, useRef } from 'react';

export function useQuiz(
    cards: any[],
    testTimer: string, // 'none' | '10s' | '35s' など
    speak: (text: string) => void
) {
    const [quizMode, setQuizMode] = useState<'choice4' | 'typing' | 'boolean'>('choice4');
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [quizOptions, setQuizOptions] = useState<string[]>([]);
    const [quizSelected, setQuizSelected] = useState<string | null>(null);

    // タイピング用
    const [typingAnswer, setTypingAnswer] = useState('');
    const [isTypingCorrect, setIsTypingCorrect] = useState<boolean | null>(null);

    // ○×テスト用
    const [booleanCurrentDisplay, setBooleanCurrentDisplay] = useState<{ text: string; isCorrectOption: boolean }>({ text: '', isCorrectOption: true });
    const [booleanSelected, setBooleanSelected] = useState<'yes' | 'no' | null>(null);

    // ⏱️ 制限時間タイマー用（ブラウザのタイマーID用に any または number に変更）
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const timerRef = useRef<any>(null);

    // クイズ全体の初期化・リセット
    const startQuiz = () => {
        setQuizIndex(0);
        setQuizScore(0);
        setQuizSelected(null);
        setTypingAnswer('');
        setIsTypingCorrect(null);
        setBooleanSelected(null);
        setupQuestion(0);
    };

    // モードが切り替わったら現在の問題を設定し直す
    useEffect(() => {
        if (cards && cards.length >= 4 && quizIndex < cards.length) {
            setupQuestion(quizIndex);
        }
    }, [quizMode]);

    // タイマーのカウントダウン処理
    useEffect(() => {
        if (quizIndex >= cards.length || quizSelected !== null || isTypingCorrect !== null || booleanSelected !== null) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        if (testTimer === 'none') {
            setTimeLeft(0);
            return;
        }

        const seconds = parseInt(testTimer, 10) || 10;
        setTimeLeft(seconds);

        if (timerRef.current) clearInterval(timerRef.current);

        // 💡 window.setInterval を明示的に指定して、Node.jsの型エラーを防ぎます
        timerRef.current = window.setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    handleTimeOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [quizIndex, quizMode, testTimer, quizSelected, isTypingCorrect, booleanSelected]);

    // ⏱️ 時間切れ時の自動ペナルティ＆次へ進む処理
    const handleTimeOut = () => {
        speak('Time out');
        if (quizMode === 'choice4') {
            setQuizSelected('__TIMEOUT__');
            setTimeout(() => { moveNext(); }, 1500);
        } else if (quizMode === 'typing') {
            setIsTypingCorrect(false);
            setTimeout(() => { moveNext(); }, 1500);
        } else if (quizMode === 'boolean') {
            setBooleanSelected('yes');
            setTimeout(() => { moveNext(); }, 1500);
        }
    };

    // 問題のセットアップ（選択肢の生成や○×のシャッフル）
    const setupQuestion = (index: number) => {
        if (!cards || cards.length < 4 || index >= cards.length) return;
        const currentCard = cards[index];

        // 1. 4選択肢の作成
        const options = [currentCard.back];
        while (options.length < 4) {
            const randomCard = cards[Math.floor(Math.random() * cards.length)];
            if (!options.includes(randomCard.back)) {
                options.push(randomCard.back);
            }
        }
        setQuizOptions(options.sort(() => Math.random() - 0.5));

        // 2. ○×テストの表示テキスト生成 (50%で正解、50%で他カードのダミー)
        const isCorrectOption = Math.random() > 0.5;
        if (isCorrectOption) {
            setBooleanCurrentDisplay({ text: currentCard.back, isCorrectOption: true });
        } else {
            let dummyText = currentCard.back;
            while (dummyText === currentCard.back) {
                const randomCard = cards[Math.floor(Math.random() * cards.length)];
                dummyText = randomCard.back;
            }
            setBooleanCurrentDisplay({ text: dummyText, isCorrectOption: false });
        }
    };

    const moveNext = () => {
        setQuizSelected(null);
        setTypingAnswer('');
        setIsTypingCorrect(null);
        setBooleanSelected(null);
        setQuizIndex((prev) => {
            const next = prev + 1;
            if (next < cards.length) {
                setupQuestion(next);
            }
            return next;
        });
    };

    // 4択クイズの回答判定
    const handleChoice4Answer = (option: string) => {
        if (quizSelected) return;
        setQuizSelected(option);
        const isCorrect = option === cards[quizIndex].back;
        if (isCorrect) {
            setQuizScore((prev) => prev + 1);
            speak('Correct');
        } else {
            speak('Wrong');
        }
        setTimeout(() => { moveNext(); }, 1500);
    };

    // タイピングテストの回答判定
    const handleTypingSubmit = (answer: string) => {
        if (isTypingCorrect !== null) return;
        const cleanUserAnswer = answer.trim().toLowerCase();
        const cleanCorrectAnswer = cards[quizIndex].front.trim().toLowerCase();

        const isCorrect = cleanUserAnswer === cleanCorrectAnswer;
        setIsTypingCorrect(isCorrect);

        if (isCorrect) {
            setQuizScore((prev) => prev + 1);
            speak('Excellent');
        } else {
            speak('Wrong');
        }

        setTimeout(() => { moveNext(); }, 1800);
    };

    // ○×テストの回答判定
    const handleBooleanAnswer = (userChoice: 'yes' | 'no') => {
        if (booleanSelected) return;
        setBooleanSelected(userChoice);

        const isCorrectOption = booleanCurrentDisplay.isCorrectOption;
        const isUserCorrect = (userChoice === 'yes' && isCorrectOption) || (userChoice === 'no' && !isCorrectOption);

        if (isUserCorrect) {
            setQuizScore((prev) => prev + 1);
            speak('Correct');
        } else {
            speak('Wrong');
        }

        setTimeout(() => { moveNext(); }, 1500);
    };

    return {
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
    };
}