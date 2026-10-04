// src/hooks/useProfile.ts
import { useEffect, useState } from 'react';
import type { User, SupabaseClientMinimal, ShowToastFn } from '../types';

export function useProfile(user: User | null, supabase: SupabaseClientMinimal, showToast: ShowToastFn) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [editDisplayName, setEditDisplayName] = useState('');
  const [dailyGoal, setDailyGoal] = useState(20);
  const [userHobby, setUserHobby] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

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
          const profile = data as {
            display_name?: string;
            user_hobby?: string;
            daily_goal?: number;
            avatar_url?: string;
          };

          if (profile.display_name) setEditDisplayName(profile.display_name);
          if (profile.user_hobby) setUserHobby(profile.user_hobby);
          if (profile.daily_goal) setDailyGoal(profile.daily_goal);
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('プロフィール情報の取得に失敗:', err);
        showToast('プロフィールの取得に失敗しました。', 'error');
      }
    }

    void fetchProfile();
  }, [user?.id, showToast, supabase]);

  const handleSaveProfile = async (setUser: (u: User | null) => void) => {
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