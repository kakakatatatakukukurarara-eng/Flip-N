import React from 'react';
import { motion } from 'framer-motion';

// page.tsxから受け取るすべてのデータや関数の型定義
interface StudyContainerProps {
    selectedCategory: string;
    setSelectedCategory: (value: string) => void;
    uniqueCategories: string[];
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    displayCards: any[];
    currentIndex: number;
    setCurrentIndex: (index: number | ((prev: number) => number)) => void;
    isFlipped: boolean;
    setIsFlipped: (flipped: boolean) => void;
    // 3Dアニメーション用のMotionValue
    x: any;
    y: any;
    rotateX: any;
    rotateY: any;
    // デザイン用のスタイルクラス
    inputBgClass: string;
    subContainerClass: string;
    innerBoxClass: string;
    cardClass: string;
    // 機能系の関数とステート
    speak: (text: string) => void;
    startPronunciationAnalysis: () => void;
    isRecording: boolean;
    pronunciationScore: number | null;
    handleResponse: (quality: number) => void;
}

export default function StudyContainer({
    selectedCategory,
    setSelectedCategory,
    uniqueCategories,
    searchQuery,
    setSearchQuery,
    displayCards,
    currentIndex,
    setCurrentIndex,
    isFlipped,
    setIsFlipped,
    x,
    y,
    rotateX,
    rotateY,
    inputBgClass,
    subContainerClass,
    innerBoxClass,
    cardClass,
    speak,
    startPronunciationAnalysis,
    isRecording,
    pronunciationScore,
    handleResponse
}: StudyContainerProps) {
    return (
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

                    {/* 🌟 1. リアルタイム進捗バー */}
                    <div className="w-full space-y-1.5 px-1 mb-2">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold tracking-wider text-slate-400">
                            <span>REVIEW PROGRESS</span>
                            <span className="text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                {currentIndex + 1} / {displayCards.length} CARDS
                            </span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden border border-transparent ${innerBoxClass}`}>
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                                animate={{ width: `${displayCards.length > 0 ? ((currentIndex) / displayCards.length) * 100 : 0}%` }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* 🌟 2. 3D立体バネ フリップカード本体 */}
                    <div
                        className="relative h-72 w-full cursor-pointer"
                        onClick={() => setIsFlipped(!isFlipped)}
                        style={{ perspective: "1200px" }}
                    >
                        <motion.div
                            style={{ x, y, rotateX, rotateY, transformStyle: "preserve-3d" }}
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 25 }}
                            className="w-full h-full relative"
                        >
                            {/* カード前面 (表面) */}
                            <div
                                className={`absolute inset-0 w-full h-full rounded-2xl border p-6 flex flex-col justify-between shadow-2xl transition-colors duration-300 ${cardClass}`}
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
                                className={`absolute inset-0 w-full h-full rounded-2xl border p-6 flex flex-col justify-between shadow-2xl transition-colors duration-300 ${cardClass}`}
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
    );
}