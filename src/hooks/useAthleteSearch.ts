import { useState, useCallback } from "react";
import type { AthleteSearchResult } from "@/app/(dashboard)/calendar/_utils";

export function useAthleteSearch() {
  const [availableAthletes, setAvailableAthletes] = useState<AthleteSearchResult[]>([]);
  const [athleteSearchQuery, setAthleteSearchQuery] = useState("");
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(false);

  const search = useCallback(
    async (scheduledClassId: string) => {
      setIsLoadingAthletes(true);
      try {
        const params = new URLSearchParams({
          scheduled_class_id: scheduledClassId,
        });
        if (athleteSearchQuery) {
          params.set("search", athleteSearchQuery);
        }
        const res = await fetch(`/api/athletes/available?${params}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableAthletes(data);
        }
      } catch (error) {
        console.error("Error fetching athletes:", error);
      } finally {
        setIsLoadingAthletes(false);
      }
    },
    [athleteSearchQuery],
  );

  return {
    availableAthletes,
    athleteSearchQuery,
    setAthleteSearchQuery,
    isLoadingAthletes,
    search,
    setAvailableAthletes,
  };
}
