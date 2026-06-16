// src/components/QuizContainer.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizContainerProps {
    cards: any[];
    isDark: boolean;
    testTimer: string;
    quizMode: 'choice4' | 'typing' | 'boolean';
    setQuizMode: (mode: 'choice4' | 'typing' | 'boolean') => void;
    quizIndex: number;
    quizScore: number;
    quizOptions: string[];
    quizSelected: string | null;
    typingAnswer: string;
    setTypingAnswer: (val: string) => void;
    isTypingCorrect: boolean | null;
    booleanCurrentDisplay: { text: string; isCorrectOption: boolean };
    booleanSelected: 'yes' | 'no' | null;
    timeLeft: number;
    startQuiz: () => void;
    handleChoice4Answer: (option: string) => void;
    handleTypingSubmit: (answer: string) => void;
    handleBooleanAnswer: (choice: 'yes' | 'no') => void;
}

export default function QuizContainer({
    cards,
    isDark,
    testTimer,
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
}: QuizContainerProps) {

    const subContainerClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/30 rounded-3xl';
    const inputBgClass = isDark ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-200/60 focus:bg-white focus:border-slate-300';

    const isAnswered =
        (quizMode === 'choice4' && quizSelected !== null) ||
        (quizMode === 'typing' && isTypingCorrect !== null) ||
        (quizMode === 'boolean' && booleanSelected !== null);

    const isCurrentCorrect =
        (quizMode === 'choice4' && quizSelected === cards[quizIndex]?.back) ||
        (quizMode === 'typing' && isTypingCorrect === true) ||
        (quizMode === 'boolean' && (
            (booleanSelected === 'yes' && booleanCurrentDisplay.isCorrectOption) ||
            (booleanSelected === 'no' && !booleanCurrentDisplay.isCorrectOption)
        ));

    const maxSeconds = parseInt(testTimer, 10) || 10;
    const timerPercentage = testTimer !== 'none' && maxSeconds > 0 ? (timeLeft / maxSeconds) * 100 : 0;

    if (!cards || cards.length < 4) {
        return (
            <main className="flex-grow flex flex-col items-center justify-center p-6 max-w-sm w-full mx-auto relative z-10">
                <div className={`w-full p-8 text-center border font-sans text-xs font-semibold text-slate-400 ${subContainerClass}`}>
                    クイズを開始するには最低4枚のカードが必要です。
                </div>
            </main>
        );
    }

    return (
        <main className="flex-grow flex flex-col items-center justify-center p-6 max-w-sm w-full mx-auto relative z-10 space-y-6">

            {/* 🌟 モードセレクター（メリハリを出しつつクリーンに） */}
            {quizIndex < cards.length && (
                <div className={`w-full p-1 rounded-2xl flex border ${isDark ? 'bg-slate-950 border-slate-900' : 'bg-slate-50 border-slate-200/40'}`}>
                    {[
                        { id: 'choice4', label: 'Choice' },
                        { id: 'typing', label: 'Typing' },
                        { id: 'boolean', label: 'True / False' }
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            disabled={isAnswered}
                            onClick={() => setQuizMode(mode.id as any)}
                            className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold tracking-tight transition-all duration-200 ${quizMode === mode.id
                                    ? isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800 shadow-xs border border-slate-200/30'
                                    : 'text-slate-400/90 hover:text-slate-600'
                                }`}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
            )}

            {quizIndex >= cards.length ? (
                /* 🏆 テスト完了画面 */
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`w-full p-8 text-center border ${subContainerClass}`}>
                    <span className="text-xl block mb-2 text-amber-400">✦</span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0.5">Quiz Completed</h4>
                    <p className="text-xs font-mono font-bold text-slate-400 mb-5">SCORE: {quizScore} / {cards.length}</p>
                    <button onClick={startQuiz} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold tracking-tight hover:bg-slate-700 transition-all">Try Again</button>
                </motion.div>
            ) : (
                <div className="w-full space-y-5">

                    {/* 上部ステータス */}
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 px-0.5">
                        <span className="tracking-wide">QUESTION {quizIndex + 1} OF {cards.length}</span>
                        <span className="tracking-wide">SCORE {quizScore}</span>
                    </div>

                    {/* ⏱️ タイマーバー */}
                    {testTimer !== 'none' && (
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden relative -mt-3">
                            <motion.div
                                animate={{ width: `${timerPercentage}%` }}
                                transition={{ duration: 0.3 }}
                                className={`h-full ${timeLeft <= 3 ? 'bg-rose-400' : 'bg-slate-400'}`}
                            />
                        </div>
                    )}

                    {/* 📝 問題カードエリア（輪郭をはっきりさせた白カード） */}
                    <div className={`p-7 rounded-3xl border text-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'}`}>
                        {quizMode === 'choice4' && (
                            <h3 className="text-[15px] font-bold tracking-tight text-slate-800 dark:text-slate-50">{cards[quizIndex].front}</h3>
                        )}

                        {quizMode === 'typing' && (
                            <div className="space-y-0.5">
                                <h3 className="text-[15px] font-bold tracking-tight text-slate-800 dark:text-slate-50">{cards[quizIndex].back}</h3>
                                {cards[quizIndex].example && (
                                    <p className="text-xs text-slate-400 font-medium italic pt-1">"{cards[quizIndex].example}"</p>
                                )}
                            </div>
                        )}

                        {quizMode === 'boolean' && (
                            <div className="space-y-3 py-0.5 max-w-[240px] mx-auto">
                                <div className="flex justify-between items-baseline border-b border-slate-100 dark:border-slate-900 pb-1.5">
                                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Front</span>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-50">{cards[quizIndex].front}</p>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Back</span>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{booleanCurrentDisplay.text}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ----------------------------------------------------
             操作パネル（はっきり分かりやすく、でも強すぎない配色）
          ---------------------------------------------------- */}

                    {/* 4択クイズ */}
                    {quizMode === 'choice4' && (
                        <div className="flex flex-col gap-2">
                            {quizOptions.map((option, idx) => {
                                const isSelected = quizSelected === option;
                                const isCorrect = option === cards[quizIndex].back;

                                let btnStyle = isDark
                                    ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50/50 shadow-xs';

                                if (quizSelected) {
                                    if (isCorrect) {
                                        // はっきり認識できるがキツくない、心地よいエメラルド
                                        btnStyle = 'bg-emerald-50/70 border-emerald-300 text-emerald-600 font-bold shadow-xs';
                                    } else if (isSelected) {
                                        // はっきり認識できるがキツくない、心地よいローズ
                                        btnStyle = 'bg-rose-50/70 border-rose-300 text-rose-600 font-bold shadow-xs';
                                    } else {
                                        btnStyle = 'opacity-20 border-transparent bg-transparent text-slate-300 pointer-events-none';
                                    }
                                }

                                return (
                                    <button
                                        key={idx}
                                        disabled={quizSelected !== null}
                                        onClick={() => handleChoice4Answer(option)}
                                        className={`w-full py-2.5 px-4 rounded-xl border text-left text-[11px] font-bold tracking-tight transition-all duration-150 ${btnStyle}`}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* タイピング入力 */}
                    {quizMode === 'typing' && (
                        <input
                            type="text"
                            autoFocus
                            placeholder="Type your answer..."
                            value={typingAnswer}
                            onChange={(e) => setTypingAnswer(e.target.value)}
                            disabled={isTypingCorrect !== null}
                            className={`w-full px-4 py-2.5 rounded-xl text-xs font-mono font-bold border text-center transition-all duration-200 ${inputBgClass} ${isTypingCorrect === true ? 'border-emerald-300 bg-emerald-50/70 text-emerald-600 font-bold' :
                                    isTypingCorrect === false ? 'border-rose-300 bg-rose-50/70 text-rose-600 font-bold' :
                                        'focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5'
                                }`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && typingAnswer.trim()) {
                                    handleTypingSubmit(typingAnswer);
                                }
                            }}
                        />
                    )}

                    {/* ○×テスト（True / False） */}
                    {quizMode === 'boolean' && (
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                disabled={booleanSelected !== null}
                                onClick={() => handleBooleanAnswer('yes')}
                                className={`py-2.5 rounded-xl font-bold transition-all border text-xs shadow-xs ${booleanSelected
                                        ? booleanCurrentDisplay.isCorrectOption
                                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-600'
                                            : booleanSelected === 'yes' ? 'bg-rose-50/70 border-rose-300 text-rose-600' : 'opacity-20 border-transparent'
                                        : isDark
                                            ? 'bg-slate-900 border-slate-800 text-slate-200'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                True
                            </button>
                            <button
                                disabled={booleanSelected !== null}
                                onClick={() => handleBooleanAnswer('no')}
                                className={`py-2.5 rounded-xl font-bold transition-all border text-xs shadow-xs ${booleanSelected
                                        ? !booleanCurrentDisplay.isCorrectOption
                                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-600'
                                            : booleanSelected === 'no' ? 'bg-rose-50/70 border-rose-300 text-rose-600' : 'opacity-20 border-transparent'
                                        : isDark
                                            ? 'bg-slate-900 border-slate-800 text-slate-200'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                False
                            </button>
                        </div>
                    )}

                    {/* 🛠️ 【固定高さエリア】はっきり見えつつモダンな判定テキスト */}
                    <div className="h-[56px] flex flex-col items-center justify-center text-center relative">
                        <AnimatePresence mode="wait">
                            {isAnswered && (
                                <motion.div
                                    initial={{ opacity: 0, y: -2 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-0.5"
                                >
                                    <p className={`text-[11px] font-extrabold tracking-wider uppercase ${isCurrentCorrect ? 'text-emerald-500' : 'text-rose-500'
                                        }`}>
                                        {isCurrentCorrect ? '✓ Correct' : '✕ Incorrect'}
                                    </p>

                                    {!isCurrentCorrect && (
                                        <p className="text-[10px] font-bold text-slate-400 font-mono tracking-tight">
                                            {quizMode === 'choice4' && `Correct: ${cards[quizIndex].back}`}
                                            {quizMode === 'typing' && `Correct: ${cards[quizIndex].front}`}
                                            {quizMode === 'boolean' && `"${cards[quizIndex].front}" is "${cards[quizIndex].back}"`}
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            )}
        </main>
    );
}