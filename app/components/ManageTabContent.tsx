import React from 'react';

interface PreviewCard {
  front: string;
  back: string;
  example: string;
  category: string;
}

interface ManageTabContentProps {
  cards: any[];
  subContainerClass: string;
  inputBgClass: string;
  cardClass: string;
  innerBoxClass: string;
  isDark: boolean;
  aiText: string;
  setAiText: (value: string) => void;
  isGenerating: boolean;
  handleGenerateAI: () => void;
  fileInputRef: any;
  handleImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessingImage: boolean;
  aiPreviewCards: PreviewCard[];
  handleConfirmAndSaveAI: () => void;
  handleExcludePreviewCard: (index: number) => void;
  handleUpdatePreviewField: (index: number, field: 'front' | 'back' | 'example', value: string) => void;
  handleCSVImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  newFront: string;
  setNewFront: (value: string) => void;
  newBack: string;
  setNewBack: (value: string) => void;
  newExample: string;
  setNewExample: (value: string) => void;
  newCategory: string;
  setNewCategory: (value: string) => void;
  newIsPublic: boolean;
  setNewIsPublic: (value: boolean) => void;
  frontInputRef: any;
  handleAddCard: (event: React.FormEvent<HTMLFormElement>) => void;
  editingCardId: number | null;
  editFront: string;
  setEditFront: (value: string) => void;
  editBack: string;
  setEditBack: (value: string) => void;
  editExample: string;
  setEditExample: (value: string) => void;
  editCategory: string;
  setEditCategory: (value: string) => void;
  editIsPublic: boolean;
  setEditIsPublic: (value: boolean) => void;
  startEditing: (card: any) => void;
  handleUpdateCard: (id: number) => void;
  setEditingCardId: (value: number | null) => void;
  handleDeleteCard: (id: number) => void;
  toggleCardPublic: (id: number, currentStatus: boolean) => void;
  handleShareDeck: (title: string, description: string) => void;
}

export default function ManageTabContent({
  cards,
  subContainerClass,
  inputBgClass,
  cardClass,
  innerBoxClass,
  isDark,
  aiText,
  setAiText,
  isGenerating,
  handleGenerateAI,
  fileInputRef,
  handleImageChange,
  isProcessingImage,
  aiPreviewCards,
  handleConfirmAndSaveAI,
  handleExcludePreviewCard,
  handleUpdatePreviewField,
  handleCSVImport,
  newFront,
  setNewFront,
  newBack,
  setNewBack,
  newExample,
  setNewExample,
  newCategory,
  setNewCategory,
  newIsPublic,
  setNewIsPublic,
  frontInputRef,
  handleAddCard,
  editingCardId,
  editFront,
  setEditFront,
  editBack,
  setEditBack,
  editExample,
  setEditExample,
  editCategory,
  setEditCategory,
  editIsPublic,
  setEditIsPublic,
  startEditing,
  handleUpdateCard,
  setEditingCardId,
  handleDeleteCard,
  toggleCardPublic,
  handleShareDeck,
}: ManageTabContentProps) {
  return (
    <main className="flex-grow p-6 max-w-4xl w-full mx-auto space-y-6 relative z-10">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-base font-black tracking-tight">単語帳の管理・編集</h3>
        <button
          onClick={() => handleShareDeck('マイベスト英会話', '自分がよく使うフレーズ集')}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-[11px] rounded-xl transition flex items-center gap-1 uppercase"
        >
          <span>🔗</span> SHARE THIS DECK
        </button>
      </div>

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
          <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />

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

      <div className={`p-5 rounded-2xl border mt-6 ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
        <h3 className="text-xs font-black font-mono mb-2 text-blue-500 tracking-wider">📁 CSV / ANKI DECK IMPORT</h3>
        <p className={`text-[11px] mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          他アプリの単語データ（CSV）を一瞬で取り込みます。「英語,日本語,例文」の順に並んだファイルに対応。
        </p>

        <label className={`block w-full text-center px-4 py-5 rounded-xl border-2 border-dashed transition-all cursor-pointer ${isDark ? 'border-slate-800 bg-slate-900/50 hover:border-blue-500' : 'border-slate-200 bg-white hover:border-blue-500'}`}>
          <svg className="w-6 h-6 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 8l-4-4m4 4l4-4M4 4h16v16H4V4z" />
          </svg>
          <span className="text-xs font-bold text-slate-400">CSVファイルを選択してインポート</span>
          <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase px-1">Deck Cards ({cards.length})</h4>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {cards.map((card) => (
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
                        <span className="text-[8px] font-mono uppercase tracking-wider text-slate-500 px-1.5 py-0.5 bg-slate-950/40 rounded border border-slate-850">{card.category || 'General'}</span>
                        {card.is_public && (
                          <span className="text-[8px] font-mono text-green-500 font-bold bg-green-500/5 border border-green-500/20 px-1 py-0.5 rounded">PUBLIC</span>
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
  );
}
