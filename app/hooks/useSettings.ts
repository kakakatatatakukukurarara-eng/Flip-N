// src/hooks/useSettings.ts
import { useState } from 'react';

export function useSettings(user: any, supabase: any, showToast: (msg: string, type: 'success' | 'error') => void) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // モーダル内で管理する設定関連のState
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [audioSpeed, setAudioSpeed] = useState('1.0');
  const [testTimer, setTestTimer] = useState('none');

  // 設定の保存処理
  const handleSaveSettings = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_autoplay: isAutoPlay,
          audio_speed: audioSpeed,
          test_timer: testTimer,
        })
        .eq('id', user.id);

      if (error) throw error;

      showToast('設定をアカウントに保存しました！', 'success');
      setIsSettingsOpen(false);
    } catch (err) {
      console.error("設定の保存に失敗:", err);
      showToast("保存に失敗しました。", "error");
    }
  };

  return {
    isSettingsOpen,
    setIsSettingsOpen,
    isAutoPlay,
    setIsAutoPlay,
    audioSpeed,
    setAudioSpeed,
    testTimer,
    setTestTimer,
    handleSaveSettings,
  };
}