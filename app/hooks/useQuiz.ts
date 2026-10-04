// src/hooks/useQuiz.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Card } from '../types';

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

  const setupQuestion = useCallback((index: number) => {
    if (!cards || cards.length < 4 || index >= cards.length) return;
    const currentCard = cards[index];

    const options = [currentCard.back];
    while (options.length < 4) {
      const randomCard = cards[Math.floor(Math.random() * cards.length)];
      if (!options.includes(randomCard.back)) {
        options.push(randomCard.back);
      }
    }
    setQuizOptions(options.sort(() => Math.random() - 0.5));

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
  }, [cards]);

  const moveNext = useCallback(() => {
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
  }, [cards.length, setupQuestion]);

  const startQuiz = useCallback(() => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizSelected(null);
    setTypingAnswer('');
    setIsTypingCorrect(null);
    setBooleanSelected(null);
    setupQuestion(0);
  }, [setupQuestion]);

  const handleTimeOut = useCallback(() => {
    speak('Time out');
    if (quizMode === 'choice4') {
      setQuizSelected('__TIMEOUT__');
      setTimeout(() => {
        moveNext();
      }, 1500);
    } else if (quizMode === 'typing') {
      setIsTypingCorrect(false);
      setTimeout(() => {
        moveNext();
      }, 1500);
    } else if (quizMode === 'boolean') {
      setBooleanSelected('yes');
      setTimeout(() => {
        moveNext();
      }, 1500);
    }
  }, [moveNext, quizMode, speak]);

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
    setTimeout(() => {
      moveNext();
    }, 1500);
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

    setTimeout(() => {
      moveNext();
    }, 1800);
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

    setTimeout(() => {
      moveNext();
    }, 1500);
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