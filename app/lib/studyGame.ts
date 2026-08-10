export interface StudyStats {
  streak: number;
  dailyMissions: {
    studyCount: number;
    testCompleted: boolean;
    speakCompleted: boolean;
  };
}

export function createInitialDailyMissions() {
  return {
    studyCount: 0,
    testCompleted: false,
    speakCompleted: false,
  };
}

export function incrementMissionProgress(
  dailyMissions: StudyStats['dailyMissions'],
  key: 'study' | 'test' | 'speak'
) {
  const updated = { ...dailyMissions };

  if (key === 'study') {
    updated.studyCount = Math.min(dailyMissions.studyCount + 1, 10);
  }
  if (key === 'test') {
    updated.testCompleted = true;
  }
  if (key === 'speak') {
    updated.speakCompleted = true;
  }

  return updated;
}

export function buildStudyLogsMap(logs: Record<string, number>) {
  return Object.entries(logs).reduce<Record<string, number>>((acc, [date, count]) => {
    acc[date] = count;
    return acc;
  }, {});
}
