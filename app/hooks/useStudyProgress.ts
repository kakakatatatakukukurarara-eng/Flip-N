import { useState } from 'react';
import { buildStudyLogsMap, createInitialDailyMissions, incrementMissionProgress as incrementMissionProgressHelper } from '../lib/studyGame';

export type MissionType = 'study' | 'test' | 'speak';

type StudyProgressUser = {
  id: string;
  displayName?: string;
};

type StudyLogRecord = {
  study_date: string;
  card_count: number;
};

type StudyProgressSupabaseClient = {
  from: (table: string) => any;
};

export function useStudyProgress(
  user: StudyProgressUser | null,
  supabase: StudyProgressSupabaseClient,
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
) {
  const [streak, setStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState('');
  const [flipCoins, setFlipCoins] = useState(0);
  const [dailyMissions, setDailyMissions] = useState(createInitialDailyMissions());
  const [studyLogs, setStudyLogs] = useState<Record<string, number>>({});

  const incrementMissionProgress = (type: MissionType) => {
    setDailyMissions((prev) => {
      const updated = incrementMissionProgressHelper(prev, type);

      if (type === 'study' && prev.studyCount < 10 && updated.studyCount === 10) {
        setFlipCoins((c) => c + 50);
        showToast('✨ ミッション達成: 10枚学習 (+50 COINS!)', 'success');
      }
      if (type === 'test' && !prev.testCompleted && updated.testCompleted) {
        setFlipCoins((c) => c + 30);
        showToast('✨ ミッション達成: クイズに挑戦 (+30 COINS!)', 'success');
      }
      if (type === 'speak' && !prev.speakCompleted && updated.speakCompleted) {
        setFlipCoins((c) => c + 40);
        showToast('✨ ミッション達成: 発音分析に挑戦 (+40 COINS!)', 'success');
      }

      return updated;
    });
  };

  async function syncStreak(currentUser: StudyProgressUser | null) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (!currentUser) {
      if (typeof window === 'undefined') return;

      const today = now.toDateString();
      const lastLogin = localStorage.getItem('last_login_date');
      const currentStreak = parseInt(localStorage.getItem('streak_count') || '0', 10);

      if (lastLogin === today) {
        setStreak(currentStreak === 0 ? 1 : currentStreak);
      } else if (lastLogin === new Date(Date.now() - 86400000).toDateString()) {
        const newStreak = currentStreak + 1;
        localStorage.setItem('streak_count', newStreak.toString());
        localStorage.setItem('last_login_date', today);
        setStreak(newStreak);
      } else {
        localStorage.setItem('streak_count', '1');
        localStorage.setItem('last_login_date', today);
        setStreak(1);
      }
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('streak_count, last_login_date')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!profile) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{ id: currentUser.id, streak_count: 1, last_login_date: todayStr }])
          .select()
          .single();
        if (newProfile) setStreak(1);
        return;
      }

      const currentStreak = profile.streak_count || 0;
      const lastLogin = profile.last_login_date;
      let nextStreak = currentStreak;

      if (lastLogin === todayStr) {
        nextStreak = currentStreak === 0 ? 1 : currentStreak;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastLogin === yesterdayStr) {
          nextStreak = currentStreak + 1;
        } else {
          nextStreak = 1;
        }

        await supabase
          .from('profiles')
          .update({ streak_count: nextStreak, last_login_date: todayStr, updated_at: new Date().toISOString() })
          .eq('id', currentUser.id);
      }

      setStreak(nextStreak);
    } catch (e) {
      console.error('Streak sync error:', e);
    }
  }

  async function recordStudy() {
    const todayStr = new Date().toISOString().split('T')[0];

    if (!user) {
      if (typeof window === 'undefined') return;

      const localLogs = JSON.parse(localStorage.getItem('study_logs_local') || '{}');
      localLogs[todayStr] = (localLogs[todayStr] || 0) + 1;
      localStorage.setItem('study_logs_local', JSON.stringify(localLogs));
      setStudyLogs(buildStudyLogsMap(localLogs));
      return;
    }

    try {
      const currentCount = studyLogs[todayStr] || 0;
      const newCount = currentCount + 1;

      const { error } = await supabase
        .from('study_logs')
        .upsert(
          { user_id: user.id, study_date: todayStr, card_count: newCount },
          { onConflict: 'user_id,study_date' }
        );

      if (!error) {
        setStudyLogs((prev) => ({ ...prev, [todayStr]: newCount }));
      }
    } catch (e) {
      console.error('Failed to record study log:', e);
    }
  }

  async function fetchStudyLogs(currentUser: StudyProgressUser | null) {
    if (!currentUser) {
      if (typeof window === 'undefined') {
        setStudyLogs({});
        return;
      }

      const localLogs = JSON.parse(localStorage.getItem('study_logs_local') || '{}');
      setStudyLogs(buildStudyLogsMap(localLogs));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('study_logs')
        .select('study_date, card_count')
        .eq('user_id', currentUser.id);

      if (data && !error) {
        const logsMap: Record<string, number> = {};
        data.forEach((log: StudyLogRecord) => {
          logsMap[log.study_date] = log.card_count;
        });
        setStudyLogs(buildStudyLogsMap(logsMap));
      }
    } catch (e) {
      console.error('Failed to fetch study logs:', e);
    }
  }

  async function handleStudyComplete() {
    if (!user) return;

    const todayStr = new Date().toISOString().split('T')[0];

    if (lastStudyDate === todayStr) {
      showToast('今日は既にストリークを更新済みです。', 'info');
      return;
    }

    const newStreak = streak + 1;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          streak_count: newStreak,
          last_study_date: todayStr,
        })
        .eq('id', user.id);

      if (error) throw error;

      setStreak(newStreak);
      setLastStudyDate(todayStr);
      showToast(`🔥 ストリーク達成！ ${newStreak} 日連続勉強中！`, 'success');
    } catch (err) {
      console.error('Streak update failed:', err);
    }
  }

  return {
    streak,
    setStreak,
    lastStudyDate,
    setLastStudyDate,
    flipCoins,
    setFlipCoins,
    dailyMissions,
    setDailyMissions,
    studyLogs,
    setStudyLogs,
    incrementMissionProgress,
    syncStreak,
    recordStudy,
    fetchStudyLogs,
    handleStudyComplete,
  };
}
