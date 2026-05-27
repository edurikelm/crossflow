import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { startOfWeek, addDays, subWeeks, addWeeks, format } from "date-fns";

export function useCalendarWeek(initialDate?: Date) {
  const [currentWeek, setCurrentWeek] = useState(initialDate ?? new Date());

  const weekStart = useMemo(
    () => startOfWeek(currentWeek, { weekStartsOn: 1 }),
    [currentWeek],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const monthYear = format(currentWeek, "MMMM yyyy").toUpperCase();

  const handlePrevWeek = useCallback(() => {
    setCurrentWeek((prev) => subWeeks(prev, 1));
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeek((prev) => addWeeks(prev, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentWeek(new Date());
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    currentWeek,
    weekStart,
    weekDays,
    currentTime,
    monthYear,
    handlePrevWeek,
    handleNextWeek,
    handleToday,
    setCurrentWeek,
  };
}
