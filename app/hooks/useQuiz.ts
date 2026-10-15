// src/hooks/useQuiz.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Card } from '../types';
import { buildQuizChoices } from '../lib/studyGame';

export function useQuiz(
  cards: Card[],
  testTimer: string,
  speak: (text: string) => void,
) {
  const [quizMode, setQuizMode] = useState<'choice4' | 'typing' | 'boolean'>('choice4');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);

  const [typingAnswer, setTypingAnswer] = useState('');
  const [isTypingCorrect, setIsTypingCorrect] = useState<boolean | null>(null);

  const [booleanCurrentDisplay, setBooleanCurrentDisplay] = useState<{ text: string; isCorrectOption: boolean }>({
    text: '',
    isCorrectOption: true,
  });
  const [booleanSelected, setBooleanSelected] = useState<'yes' | 'no' | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const advanceTimeoutRef = useRef<number | null>(null);

  const setupQuestion = useCallback((index: number) => {
    if (!cards || cards.length < 4 || index >= cards.length) return;
    const currentCard = cards[index];

    const options = buildQuizChoices(cards.map((card) => card.back), currentCard.back);
    setQuizOptions(options);

    const wrongAnswers = Array.from(new Set(cards.map((card) => card.back)))
      .filter((answer) => answer !== currentCard.back);
    const isCorrectOption = wrongAnswers.length === 0 || Math.random() > 0.5;
    if (isCorrectOption) {
      setBooleanCurrentDisplay({ text: currentCard.back, isCorrectOption: true });
    } else {
      const dummyText = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
      setBooleanCurrentDisplay({ text: dummyText, isCorrectOption: false });
    }
  }, [cards]);

  const moveNext = useCallback(() => {
    setQuizSelected(null);
    setTypingAnswer('');
    setIsTypingCorrect(null);
    setBooleanSelected(null);
    const next = quizIndex + 1;
    if (next < cards.length) setupQuestion(next);
    setQuizIndex(next);
  }, [cards.length, quizIndex, setupQuestion]);

  const clearAdvanceTimeout = useCallback(() => {
    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  const scheduleMoveNext = useCallback((delay: number) => {
    clearAdvanceTimeout();
    advanceTimeoutRef.current = window.setTimeout(() => {
      advanceTimeoutRef.current = null;
      moveNext();
    }, delay);
  }, [clearAdvanceTimeout, moveNext]);

  const startQuiz = useCallback(() => {
    clearAdvanceTimeout();
    setQuizIndex(0);
    setQuizScore(0);
    setQuizSelected(null);
    setTypingAnswer('');
    setIsTypingCorrect(null);
    setBooleanSelected(null);
    setupQuestion(0);
  }, [clearAdvanceTimeout, setupQuestion]);

  const handleTimeOut = useCallback(() => {
    speak('Time out');
    if (quizMode === 'choice4') {
      setQuizSelected('__TIMEOUT__');
      scheduleMoveNext(1500);
    } else if (quizMode === 'typing') {
      setIsTypingCorrect(false);
      scheduleMoveNext(1500);
    } else if (quizMode === 'boolean') {
      setBooleanSelected(booleanCurrentDisplay.isCorrectOption ? 'no' : 'yes');
      scheduleMoveNext(1500);
    }
  }, [booleanCurrentDisplay.isCorrectOption, quizMode, scheduleMoveNext, speak]);

  useEffect(() => () => {
    if (advanceTimeoutRef.current !== null) window.clearTimeout(advanceTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (quizIndex >= cards.length || quizSelected !== null || isTypingCorrect !== null || booleanSelected !== null) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (testTimer === 'none') {
      return;
    }

    const seconds = Number.parseInt(testTimer, 10) || 10;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(seconds);

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [booleanSelected, cards.length, handleTimeOut, isTypingCorrect, quizIndex, quizSelected, testTimer]);

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
    scheduleMoveNext(1500);
  };

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

    scheduleMoveNext(1800);
  };

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

    scheduleMoveNext(1500);
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