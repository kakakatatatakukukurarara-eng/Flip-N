import { useState } from 'react';
import type { SupabaseClientMinimal } from '../types';
import {
  buildStudyLogsMap,
  calculateStudyStreak,
  createInitialDailyMissions,
  getDateDifferenceInDays,
  getLocalDateString,
  incrementMissionProgress as incrementMissionProgressHelper,
} from '../lib/studyGame';

export type MissionType = 'study' | 'test' | 'speak';

type StudyProgressUser = {
  id: string;
  displayName?: string;
};

type StudyLogRecord = {
  study_date: string;
  card_count: number;
};

export function useStudyProgress(
  user: StudyProgressUser | null,
  supabase: SupabaseClientMinimal,
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
) {
  const [streak, setStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState('');
  const [dailyMissions, setDailyMissions] = useState(createInitialDailyMissions());
  const [studyLogs, setStudyLogs] = useState<Record<string, number>>({});

  const incrementMissionProgress = (type: MissionType) => {
    setDailyMissions((prev) => {
      const updated = incrementMissionProgressHelper(prev, type);

      return updated;
    });
  };

  async function syncStreak(currentUser: StudyProgressUser | null) {
    const todayStr = getLocalDateString();

    if (!currentUser) {
      if (typeof window === 'undefined') return;

      const lastStudy = localStorage.getItem('last_study_date') || '';
      const savedStreak = Number.parseInt(localStorage.getItem('streak_count') || '0', 10);
      const daysSinceLastStudy = getDateDifferenceInDays(lastStudy, todayStr);
      setLastStudyDate(lastStudy);
      setStreak(daysSinceLastStudy >= 0 && daysSinceLastStudy <= 1 ? savedStreak : 0);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('streak_count, last_study_date')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!profile) {
        await supabase
          .from('profiles')
          .insert([{ id: currentUser.id, streak_count: 0, last_study_date: null }]);
        setStreak(0);
        setLastStudyDate('');
        return;
      }

      const savedStreak = Number(profile.streak_count) || 0;
      const lastStudy = profile.last_study_date || '';
      const daysSinceLastStudy = getDateDifferenceInDays(lastStudy, todayStr);
      setLastStudyDate(lastStudy);
      setStreak(daysSinceLastStudy >= 0 && daysSinceLastStudy <= 1 ? savedStreak : 0);
    } catch (e) {
      console.error('Streak sync error:', e);
    }
  }

  async function recordStudy() {
    const todayStr = getLocalDateString();

    if (!user) {
      if (typeof window === 'undefined') return;

      const localLogs = JSON.parse(localStorage.getItem('study_logs_local') || '{}');
      localLogs[todayStr] = (localLogs[todayStr] || 0) + 1;
      localStorage.setItem('study_logs_local', JSON.stringify(localLogs));
      setStudyLogs(buildStudyLogsMap(localLogs));
      if (lastStudyDate !== todayStr) {
        const nextStreak = calculateStudyStreak(streak, lastStudyDate, todayStr);
        localStorage.setItem('streak_count', String(nextStreak));
        localStorage.setItem('last_study_date', todayStr);
        setStreak(nextStreak);
        setLastStudyDate(todayStr);
        showToast(`🔥 ストリーク達成！ ${nextStreak} 日連続勉強中！`, 'success');
      }
      return;
    }

    if (lastStudyDate !== todayStr) {
      const nextStreak = calculateStudyStreak(streak, lastStudyDate, todayStr);
      setStreak(nextStreak);
      setLastStudyDate(todayStr);

      try {
        const { error } = await supabase
          .from('profiles')
          .update({ streak_count: nextStreak, last_study_date: todayStr, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (error) throw error;
        showToast(`🔥 ストリーク達成！ ${nextStreak} 日連続勉強中！`, 'success');
      } catch (e) {
        console.error('Streak update failed:', e);
      }
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

  return {
    streak,
    setStreak,
    lastStudyDate,
    setLastStudyDate,
    dailyMissions,
    setDailyMissions,
    studyLogs,
    setStudyLogs,
    incrementMissionProgress,
    syncStreak,
    recordStudy,
    fetchStudyLogs,
  };
}
