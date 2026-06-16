// src/hooks/useProfile.ts
import { useState, useEffect } from 'react';

export function useProfile(user: any, supabase: any, showToast: (msg: string, type: 'success' | 'error') => void) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // モーダル内で管理するプロフィール関連のState
  const [editDisplayName, setEditDisplayName] = useState('');
  const [dailyGoal, setDailyGoal] = useState(20);
  const [userHobby, setUserHobby] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // ユーザーがログイン、または情報が更新されたら初期値を同期
  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || '');
    }
  }, [user]);

  // 【機能強化】もし初回ロード時にSupabaseのprofilesテーブルからデータを引っ張りたい場合はここで行えます
  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, user_hobby, daily_goal, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          if (data.display_name) setEditDisplayName(data.display_name);
          if (data.user_hobby) setUserHobby(data.user_hobby);
          if (data.daily_goal) setDailyGoal(data.daily_goal);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
        }
      } catch (err) {
        console.error("プロフィール情報の取得に失敗:", err);
      }
    }
    fetchProfile();
  }, [user?.id, supabase]);

  // プロフィール保存処理
  const handleSaveProfile = async (setUser: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editDisplayName,
          user_hobby: userHobby,
          daily_goal: dailyGoal,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      // 親コンポーネント（page.tsx）のuserステートも更新
      setUser({ ...user, displayName: editDisplayName });
      showToast('プロフィールをアカウントに保存しました！', 'success');
      setIsProfileOpen(false);
    } catch (err) {
      console.error("プロフィールの保存に失敗:", err);
      showToast("保存に失敗しました。", "error");
    }
  };

  return {
    isProfileOpen,
    setIsProfileOpen,
    editDisplayName,
    setEditDisplayName,
    dailyGoal,
    setDailyGoal,
    userHobby,
    setUserHobby,
    avatarUrl,
    setAvatarUrl,
    handleSaveProfile,
  };
}