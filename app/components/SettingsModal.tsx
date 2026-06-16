// src/components/SettingsModal.tsx
import React from 'react';

interface SettingsModalProps {
  isDark: boolean;
  isAutoPlay: boolean;
  setIsAutoPlay: (val: boolean) => void;
  audioSpeed: string;
  setAudioSpeed: (val: string) => void;
  testTimer: string;
  setTestTimer: (val: string) => void;
  setIsSettingsOpen: (val: boolean) => void;
  handleSaveSettings: () => Promise<void>;
}

export default function SettingsModal({
  isDark,
  isAutoPlay,
  setIsAutoPlay,
  audioSpeed,
  setAudioSpeed,
  testTimer,
  setTestTimer,
  setIsSettingsOpen,
  handleSaveSettings,
}: SettingsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-bold mb-6 font-mono ${isDark ? 'text-white' : 'text-slate-800'}`}>SETTINGS</h2>

        <div className="space-y-5">
          {/* 1. 音声自動再生（トグルスイッチ） */}
          <div className="flex items-center justify-between p-1">
            <div>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>音声の自動再生</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>カードをめくった時に発音を自動再生</p>
            </div>
            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`w-11 h-6 rounded-full relative transition-colors shadow-inner ${isAutoPlay ? 'bg-blue-600' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${isAutoPlay ? 'right-1' : 'left-1'}`}></span>
            </button>
          </div>

          {/* 2. 音声再生スピード（セレクトボックス） */}
          <div className="flex items-center justify-between p-1">
            <div>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>音声の再生速度</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>リスニング時の発音スピード</p>
            </div>
            <select
              value={audioSpeed}
              onChange={(e) => setAudioSpeed(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
            >
              <option value="1.0">1.0x (標準)</option>
              <option value="0.8">0.8x (ゆっくり)</option>
              <option value="1.2">1.2x (速め)</option>
            </select>
          </div>

          {/* 3. クイズの制限時間設定（セレクトボックス） */}
          <div className="flex items-center justify-between p-1">
            <div>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>テストの制限時間</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>4択クイズやテストモード時の1問の制限</p>
            </div>
            <select
              value={testTimer}
              onChange={(e) => setTestTimer(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
            >
              <option value="none">制限なし</option>
              <option value="5">5秒 (超シビア)</option>
              <option value="10">10秒 (標準)</option>
              <option value="30">30秒 (ゆったり)</option>
            </select>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-end gap-3 mt-8 border-t pt-4 border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            キャンセル
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg shadow-blue-500/20"
          >
            設定を保存
          </button>
        </div>
      </div>
    </div>
  );
}