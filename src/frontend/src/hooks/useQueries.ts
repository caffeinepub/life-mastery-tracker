import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DailyEntry, WeeklyHobbies } from "../backend.d";
import {
  currentWeekDates,
  currentWeekKey,
  todayKey,
  weekDatesFromStart,
  weekKeyFromDate,
} from "../lib/dateUtils";
import { useActor } from "./useActor";

export function useTodayEntry() {
  const { actor, isFetching } = useActor();
  const dateKey = todayKey();
  return useQuery<DailyEntry | null>({
    queryKey: ["dailyEntry", dateKey],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDailyEntry(dateKey);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveDailyEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: DailyEntry) => {
      if (!actor) throw new Error("No actor");
      const dateKey = todayKey();
      await actor.saveDailyEntry(dateKey, entry);
      return dateKey;
    },
    onSuccess: (dateKey) => {
      queryClient.invalidateQueries({ queryKey: ["dailyEntry", dateKey] });
      queryClient.invalidateQueries({ queryKey: ["weekEntries"] });
      queryClient.invalidateQueries({ queryKey: ["allEntryDates"] });
    },
  });
}

export function useCurrentWeekEntries() {
  const { actor, isFetching } = useActor();
  const dates = currentWeekDates();
  return useQuery<[string, DailyEntry][]>({
    queryKey: ["weekEntries", dates[0]],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDailyEntriesByDates(dates);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCurrentWeekHobbies() {
  const { actor, isFetching } = useActor();
  const weekKey = currentWeekKey();
  return useQuery<WeeklyHobbies | null>({
    queryKey: ["weeklyHobbies", weekKey],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getWeeklyHobbies(weekKey);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveWeeklyHobbies() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      weekKey,
      hobbies,
    }: {
      weekKey: string;
      hobbies: WeeklyHobbies;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.saveWeeklyHobbies(weekKey, hobbies);
    },
    onSuccess: (_, { weekKey }) => {
      queryClient.invalidateQueries({ queryKey: ["weeklyHobbies", weekKey] });
    },
  });
}

export function useAllEntryDates() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["allEntryDates"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDailyEntryDates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWeekEntries(weekStart: Date) {
  const { actor, isFetching } = useActor();
  const dates = weekDatesFromStart(weekStart);
  return useQuery<[string, DailyEntry][]>({
    queryKey: ["weekEntries", dates[0]],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDailyEntriesByDates(dates);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWeekHobbies(weekKey: string) {
  const { actor, isFetching } = useActor();
  return useQuery<WeeklyHobbies | null>({
    queryKey: ["weeklyHobbies", weekKey],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getWeeklyHobbies(weekKey);
    },
    enabled: !!actor && !isFetching,
  });
}

// Re-export for convenience
export { currentWeekKey, weekKeyFromDate };
