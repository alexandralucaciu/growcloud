import { useState } from 'react';

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

function resolveAndSaveStreakState() {
  const today = formatLocalDate();
  const yesterday = getYesterdayDateString();

  const storedStreak = Number(window.localStorage.getItem(STREAK_COUNT_KEY) || '0');
  const lastVisitDate = window.localStorage.getItem(LAST_VISIT_DATE_KEY);

  let finalStreak = 1;

  if (!lastVisitDate) {
    finalStreak = 1;
  } else if (lastVisitDate === today) {
    finalStreak = storedStreak > 0 ? storedStreak : 1;
  } else if (lastVisitDate === yesterday) {
    finalStreak = storedStreak > 0 ? storedStreak + 1 : 2;
  } else {
    finalStreak = 1;
  }

  window.localStorage.setItem(STREAK_COUNT_KEY, String(finalStreak));
  window.localStorage.setItem(LAST_VISIT_DATE_KEY, today);

  return finalStreak;
}

export function usePlantStreak() {
  const [streakCount] = useState(() => resolveAndSaveStreakState());
  return { streakCount };
}
