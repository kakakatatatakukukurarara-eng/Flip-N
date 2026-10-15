// src/hooks/useProfile.ts
import { useCallback, useState } from 'react';
import type { User, SupabaseClientMinimal, ShowToastFn } from '../types';

const normalizeDailyGoal = (value: number) => {
  if (!Number.isFinite(value)) return 20;
  return Math.min(200, Math.max(5, Math.round(value)));
};

export function useProfile(user: User | null, supabase: SupabaseClientMinimal, showToast: ShowToastFn) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [editDisplayName, setEditDisplayName] = useState('');
  const [dailyGoal, setDailyGoalState] = useState(20);
  const [userHobby, setUserHobby] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const setDailyGoal = useCallback((value: number) => {
    setDailyGoalState(normalizeDailyGoal(value));
  }, []);

  const handleSaveProfile = async (setUser: (u: User | null) => void) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editDisplayName,
          user_hobby: userHobby,
          daily_goal: normalizeDailyGoal(dailyGoal),
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, displayName: editDisplayName });
      showToast('プロフィールをアカウントに保存しました！', 'success');
      setIsProfileOpen(false);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('プロフィールの保存に失敗:', err);
      showToast('保存に失敗しました。', 'error');
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