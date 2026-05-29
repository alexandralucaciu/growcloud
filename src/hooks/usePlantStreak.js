import { useEffect, useState } from 'react';

const STREAK_COUNT_KEY = 'growcloud_streak_count';
const LAST_VISIT_DATE_KEY = 'growcloud_last_visit_date';

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(today = new Date()) {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return formatLocalDate(yesterday);
}

function resolveStreakState() {
  const today = formatLocalDate();
  const yesterday = getYesterdayDateString();

  const storedStreak = Number(window.localStorage.getItem(STREAK_COUNT_KEY) || '0');
  const lastVisitDate = window.localStorage.getItem(LAST_VISIT_DATE_KEY);

  if (!lastVisitDate) {
    return { streakCount: 1, today };
  }

  if (lastVisitDate === today) {
    return { streakCount: storedStreak > 0 ? storedStreak : 1, today };
  }

  if (lastVisitDate === yesterday) {
    return { streakCount: storedStreak > 0 ? storedStreak + 1 : 2, today };
  }

  return { streakCount: 1, today };
}

export function usePlantStreak() {
  const [streakCount] = useState(() => resolveStreakState().streakCount);

  useEffect(() => {
    const { streakCount: nextStreak, today } = resolveStreakState();
    window.localStorage.setItem(STREAK_COUNT_KEY, String(nextStreak));
    window.localStorage.setItem(LAST_VISIT_DATE_KEY, today);
  }, []);

  return { streakCount };
}
