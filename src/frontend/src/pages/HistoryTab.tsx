import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  useAllEntryDates,
  useWeekEntries,
  useWeekHobbies,
} from "@/hooks/useQueries";
import {
  currentWeekKey,
  dateToWeekKey,
  weekLabel,
  weekStartFromKey,
} from "@/lib/dateUtils";
import {
  type DailyScores,
  computeWeeklyAverages,
  hobbyScore,
  masterClassification,
  masterIndicator,
  scoreColorClass,
} from "@/scoreEngine";
import { startOfISOWeek } from "date-fns";
import { ChevronDown, Loader2 } from "lucide-react";
import { useMemo } from "react";

const INDICATOR_META = [
  { key: "study", label: "Study", icon: "📚" },
  { key: "digitalWellbeing", label: "Digital Wellbeing", icon: "📱" },
  { key: "recharge", label: "Recharge", icon: "🔋" },
  { key: "health", label: "Health", icon: "💚" },
  { key: "baselineThought", label: "Baseline Thought", icon: "🧠" },
  { key: "guruPranam", label: "Guru Pranam", icon: "🕯️" },
  { key: "controlOverLife", label: "Control Over Life", icon: "🎯" },
  { key: "attentionToHealth", label: "Attention to Health", icon: "🌿" },
  { key: "hobbies", label: "Hobbies", icon: "🎨" },
];

const BADGE_CLASS: Record<string, string> = {
  "Exceptional Week":
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  "Excellent Week": "border-green-500/50 bg-green-500/10 text-green-400",
  "Good Week": "border-green-500/30 bg-green-500/8 text-green-300",
  "Acceptable Week": "border-amber-500/50 bg-amber-500/10 text-amber-400",
  "Weak Week": "border-orange-500/50 bg-orange-500/10 text-orange-400",
  "Poor Week": "border-red-500/50 bg-red-500/10 text-red-400",
  "Collapse Week": "border-red-600/50 bg-red-600/10 text-red-300",
};

function WeekBreakdown({ weekKey }: { weekKey: string }) {
  const weekStart = weekStartFromKey(weekKey);
  const { data: entriesData, isLoading: entriesLoading } =
    useWeekEntries(weekStart);
  const { data: hobbiesData, isLoading: hobbiesLoading } =
    useWeekHobbies(weekKey);

  if (entriesLoading || hobbiesLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="animate-spin text-primary" size={20} />
      </div>
    );
  }

  const entries = (entriesData ?? []).map(([, e]) => e);
  const weeklyAvg = computeWeeklyAverages(entries);
  const hs = hobbiesData ? hobbyScore(hobbiesData) : 0;
  const master = masterIndicator(weeklyAvg, hs);
  const lowestKey = [
    ...INDICATOR_META.slice(0, 8).map((m) => ({
      key: m.key,
      score: weeklyAvg[m.key as keyof DailyScores],
    })),
    { key: "hobbies", score: hs },
  ].reduce((a, b) => (a.score <= b.score ? a : b)).key;

  const allScores: Record<string, number> = {
    ...Object.fromEntries(
      INDICATOR_META.slice(0, 8).map((m) => [
        m.key,
        weeklyAvg[m.key as keyof DailyScores],
      ]),
    ),
    hobbies: hs,
  };

  return (
    <div className="space-y-2 pt-2">
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          No entries found for this week.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            {entries.length} day(s) logged · Master: {master.toFixed(1)}
          </p>
          {INDICATOR_META.map((meta) => {
            const score = allScores[meta.key];
            const color = scoreColorClass(score);
            const textClass =
              color === "green"
                ? "score-text-green"
                : color === "amber"
                  ? "score-text-amber"
                  : "score-text-red";
            return (
              <div key={meta.key} className="flex items-center gap-2">
                <span className="text-sm w-6">{meta.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <span
                      className={`text-xs ${
                        meta.key === lowestKey
                          ? "text-destructive font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {meta.label}
                      {meta.key === lowestKey && " ⚠"}
                    </span>
                    <span
                      className={`text-xs font-bold tabular-nums ${textClass}`}
                    >
                      {score.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        color === "green"
                          ? "bar-green"
                          : color === "amber"
                            ? "bar-amber"
                            : "bar-red"
                      }`}
                      style={{ width: `${(score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default function HistoryTab() {
  const { data: allDates, isLoading } = useAllEntryDates();
  const thisWeekKey = currentWeekKey();

  const pastWeeks = useMemo(() => {
    if (!allDates || allDates.length === 0) return [];
    const weekMap = new Map<string, string[]>();
    for (const dateStr of allDates) {
      const wk = dateToWeekKey(dateStr);
      if (wk === thisWeekKey) continue; // skip current week
      if (!weekMap.has(wk)) weekMap.set(wk, []);
      weekMap.get(wk)!.push(dateStr);
    }
    // Sort by week key descending (most recent first)
    return Array.from(weekMap.entries())
      .sort(([a], [b]) => (a > b ? -1 : 1))
      .map(([weekKey]) => weekKey);
  }, [allDates, thisWeekKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <p className="text-xs section-header mb-1">Past Weeks</p>
        <h2 className="font-display text-2xl font-bold">History</h2>
      </div>

      {pastWeeks.length === 0 ? (
        <div
          data-ocid="history.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <p className="text-4xl mb-3">📜</p>
          <p className="font-medium">No history yet</p>
          <p className="text-sm mt-1">
            Complete your first week to see it here.
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {pastWeeks.map((weekKey, idx) => {
            const weekStart = weekStartFromKey(weekKey);
            const label = weekLabel(weekStart);
            const ocidIdx = idx + 1;
            return (
              <AccordionItem
                key={weekKey}
                value={weekKey}
                data-ocid={`history.item.${ocidIdx}`}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/20 [&[data-state=open]]:bg-muted/20">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {weekKey}
                      </p>
                    </div>
                    <WeekBadge weekKey={weekKey} />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4">
                  <WeekBreakdown weekKey={weekKey} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

// Separate component that fetches and displays master score badge
function WeekBadge({ weekKey }: { weekKey: string }) {
  const weekStart = weekStartFromKey(weekKey);
  const { data: entriesData } = useWeekEntries(weekStart);
  const { data: hobbiesData } = useWeekHobbies(weekKey);

  if (!entriesData) return null;

  const entries = entriesData.map(([, e]) => e);
  if (entries.length === 0) return null;

  const weeklyAvg = computeWeeklyAverages(entries);
  const hs = hobbiesData ? hobbyScore(hobbiesData) : 0;
  const master = masterIndicator(weeklyAvg, hs);
  const classification = masterClassification(master);
  const badgeClass =
    BADGE_CLASS[classification] ?? "border-border text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold mr-4 ${badgeClass}`}
    >
      <span className="tabular-nums">{master.toFixed(1)}</span>
      <span className="text-xs opacity-75">{classification.split(" ")[0]}</span>
    </span>
  );
}
