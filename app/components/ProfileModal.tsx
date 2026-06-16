// src/components/ProfileModal.tsx
import React from 'react';

interface ProfileModalProps {
  isDark: boolean;
  user: any;
  onClose: () => void;
  editDisplayName: string;
  setEditDisplayName: (val: string) => void;
  dailyGoal: number;
  setDailyGoal: (val: number) => void;
  userHobby: string;
  setUserHobby: (val: string) => void;
  avatarUrl: string;
  setAvatarUrl: (val: string) => void;
  onSave: () => Promise<void>;
}

export default function ProfileModal({
  isDark,
  user,
  onClose,
  editDisplayName,
  setEditDisplayName,
  dailyGoal,
  setDailyGoal,
  userHobby,
  setUserHobby,
  avatarUrl,
  setAvatarUrl,
  onSave,
}: ProfileModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-bold mb-6 font-mono ${isDark ? 'text-white' : 'text-slate-800'}`}>USER PROFILE</h2>

        <div className="space-y-5">
          {/* アバター画像変更 */}
          <div className="mb-5 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500 shadow-md bg-slate-100 relative group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                  No Image
                </div>
              )}
            </div>

            <label className="cursor-pointer px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-all">
              画像を変更する
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setAvatarUrl(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>

          {/* 1. 表示名の変更 */}
          <div>
            <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>表示名 (Display Name)</label>
            <input
              type="text"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              placeholder="お名前を入力"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
            />
          </div>

          {/* 2. 1日の目標単語数 */}
          <div>
            <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>1日の目標学習数 (Daily Goal)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                min="5"
                max="200"
                className={`w-24 px-4 py-2.5 rounded-xl border text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>単語 / 日</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">5〜200個の間で設定できます</p>
          </div>
        </div>

        {/* 3. 趣味・推し設定 */}
        <div className="mt-4">
          <label className={`block text-xs font-black font-mono mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            🎨 YOUR HOBBY / INTERESTS (趣味・推し)
          </label>
          <input
            type="text"
            value={userHobby}
            onChange={(e) => setUserHobby(e.target.value)}
            placeholder="例: サッカー, アニメ, ガジェット, K-POP"
            className={`w-full px-3 py-2 rounded-xl text-xs border font-bold focus:outline-none transition-all ${isDark
              ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500'
              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-500'
              }`}
          />
          <p className="text-[10px] text-slate-400 mt-1">
            ※ここに入力した趣味に合わせて、AIがあなた専用の例文を自動生成するようになります！
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-end gap-3 mt-8 border-t pt-4 border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            キャンセル
          </button>
          <button
            onClick={() => onSave()}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg shadow-blue-500/20"
          >
            プロフィールを保存
          </button>
        </div>
      </div>
    </div>
  );
}