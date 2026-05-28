import { useEffect, useState } from 'react';

export function isNightModeNow() {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 6;
}

export function useNightMode() {
  const [isNightMode, setIsNightMode] = useState(() => isNightModeNow());

  useEffect(() => {
    const updateMode = () => setIsNightMode(isNightModeNow());
    updateMode();

    const intervalId = window.setInterval(updateMode, 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return isNightMode;
}