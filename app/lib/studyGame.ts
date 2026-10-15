export interface StudyStats {
  streak: number;
  dailyMissions: {
    studyCount: number;
    testCompleted: boolean;
    speakCompleted: boolean;
  };
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateDifferenceInDays(fromDate: string, toDate: string) {
  const parseDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

    const [year, month, day] = value.split('-').map(Number);
    const timestamp = Date.UTC(year, month - 1, day);
    return new Date(timestamp).toISOString().slice(0, 10) === value ? timestamp : null;
  };

  const fromTimestamp = parseDate(fromDate);
  const toTimestamp = parseDate(toDate);
  if (fromTimestamp === null || toTimestamp === null) return Number.NaN;

  return (toTimestamp - fromTimestamp) / 86400000;
}

export function calculateStudyStreak(streak: number, lastStudyDate: string, today: string) {
  const daysSinceLastStudy = getDateDifferenceInDays(lastStudyDate, today);

  if (daysSinceLastStudy === 0) return Math.max(streak, 1);
  if (daysSinceLastStudy === 1) return streak + 1;
  return 1;
}

export function buildQuizChoices(answers: string[], correctAnswer: string, maxChoices = 4) {
  const distractors = Array.from(new Set(answers)).filter((answer) => answer !== correctAnswer);

  for (let index = distractors.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [distractors[index], distractors[randomIndex]] = [distractors[randomIndex], distractors[index]];
  }

  const choices = [correctAnswer, ...distractors.slice(0, Math.max(0, maxChoices - 1))];
  for (let index = choices.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [choices[index], choices[randomIndex]] = [choices[randomIndex], choices[index]];
  }

  return choices;
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
