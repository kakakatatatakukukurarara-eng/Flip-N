import React from 'react';

interface ExtensionModalProps {
  isOpen: boolean;
  isDark: boolean;
  aiCharacter: string;
  aiMessage: string;
  currentRoomId: string;
  inputRoomId: string;
  setInputRoomId: (value: string) => void;
  leaderboard: Array<{ name: string; words: number }>;
  onClose: () => void;
  onSelectCharacter: (character: string) => void;
  onJoinRoom: () => void;
  onImportCsv: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ExtensionModal({
  isOpen,
  isDark,
  aiCharacter,
  aiMessage,
  currentRoomId,
  inputRoomId,
  setInputRoomId,
  leaderboard,
  onClose,
  onSelectCharacter,
  onJoinRoom,
  onImportCsv,
}: ExtensionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md overflow-y-auto">
      <div className={`w-full max-w-4xl rounded-3xl shadow-2xl p-6 my-8 ${isDark ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black font-mono tracking-wider text-blue-500">FLIP-N PRO EXTENSIONS</h2>
            <p className="text-xs text-slate-400 mt-1">ユーザーが集まる＆爆伸びする神機能全部入りパック</p>
          </div>
          <button onClick={onClose} className="text-sm font-mono px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg">CLOSE</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className="text-xs font-black font-mono mb-3 text-purple-500 flex items-center gap-1">🤖 1. AI STUDY PARTNER</h3>
              <div className="flex gap-3 mb-4">
                {['🦊', '🤖', '👑'].map((char) => (
                  <button
                    key={char}
                    onClick={() => onSelectCharacter(char)}
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
                <button onClick={onJoinRoom} className="px-4 py-2 bg-green-600 text-white font-bold rounded-xl text-xs hover:bg-green-500 transition">参加/作成</button>
              </div>
              {currentRoomId && (
                <div className="mt-3 text-xs text-green-500 font-mono font-bold flex items-center gap-1">
                  🟢 接続中ルーム: {currentRoomId}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
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

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className="text-xs font-black font-mono mb-3 text-blue-500 flex items-center gap-1">📁 4. ANKI / CSV IMPORT</h3>
              <p className="text-[10px] text-slate-400 mb-3">他アプリで作った単語データ（CSV）を一瞬でFLIP-Nにインポート。カンマ区切り「英語,日本語,例文」のファイルに対応しています。</p>
              <label className="block w-full text-center px-4 py-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 cursor-pointer transition">
                <span className="text-xs font-bold text-slate-400">CSVファイルを選択して爆速インポート</span>
                <input type="file" accept=".csv" onChange={onImportCsv} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
